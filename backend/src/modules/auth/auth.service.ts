import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { hashPassword, memberCodeFor, sha256Hex, verifyPassword } from '../../common/utils/crypto.util';
import { RegisterDto } from './dto';
import { randomUUID } from 'crypto';

const ACCESS_COOKIE = 'asaphis_at';
const REFRESH_COOKIE = 'asaphis_rt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private cookieOpts(remember: boolean) {
    const secure = this.config.get<boolean>('COOKIE_SECURE') ?? false;
    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: remember ? this.config.get<number>('JWT_REFRESH_TTL')! * 1000 : undefined,
    };
  }

  async register(dto: RegisterDto, ctx: { ip?: string; userAgent?: string }) {
    if (!dto.termsAccepted || !dto.privacyAccepted) {
      throw new BadRequestException('Terms and privacy acknowledgement are required');
    }
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await hashPassword(dto.password);
    const country = (dto.countryOfCitizenship ?? 'NG').toUpperCase().slice(0, 2);
    const user = await this.prisma.user.create({
      data: {
        email,
        phone: dto.phone,
        passwordHash,
        roles: ['MEMBER'],
        membershipStage: 'PHONE_VERIFICATION',
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        member: {
          create: {
            memberCode: memberCodeFor(country),
            displayName: dto.name,
            initials: dto.name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
            citizenshipCountry: country,
          },
        },
      },
      include: { member: true },
    });

    await this.prisma.auditLog.create({
      data: { actorId: user.id, action: 'auth.register', target: user.id, ip: ctx.ip, metadata: { email } },
    });
    return { userId: user.id, memberId: user.member?.id, stage: user.membershipStage };
  }

  async login(email: string, password: string, ctx: { ip?: string; userAgent?: string; deviceKey?: string }) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized }, include: { member: true } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new UnauthorizedException('Account temporarily locked');
    if (['SUSPENDED', 'BANNED'].includes(user.accountStatus)) throw new UnauthorizedException('Account restricted');

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      const failed = user.failedLoginCount + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failed,
          lockedUntil: failed >= 10 ? new Date(Date.now() + 15 * 60_000) : undefined,
        },
      });
      await this.prisma.auditLog.create({
        data: { actorId: user.id, action: 'auth.login.failed', target: user.id, ip: ctx.ip, metadata: {} },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    // Upsert device lightly (full device intel lives in devices module)
    let deviceId: string | undefined;
    if (ctx.deviceKey) {
      const d = await this.prisma.device.upsert({
        where: { userId_deviceKey: { userId: user.id, deviceKey: sha256Hex(ctx.deviceKey) } },
        create: { userId: user.id, deviceKey: sha256Hex(ctx.deviceKey), lastIp: ctx.ip, lastSeenAt: new Date() },
        update: { lastSeenAt: new Date(), lastIp: ctx.ip },
      });
      deviceId = d.id;
    }

    const sessionId = randomUUID();
    const accessTtl = this.config.get<number>('JWT_ACCESS_TTL') ?? 900;
    const refreshTtl = this.config.get<number>('JWT_REFRESH_TTL') ?? 2592000;
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, roles: user.roles, sessionId },
      { secret: this.config.get<string>('JWT_ACCESS_SECRET'), expiresIn: accessTtl },
    );
    const refreshToken = randomUUID();
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        deviceId,
        refreshHash: sha256Hex(refreshToken),
        ip: ctx.ip,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    await this.prisma.auditLog.create({
      data: { actorId: user.id, action: 'auth.login', target: user.id, ip: ctx.ip, metadata: { sessionId } },
    });

    return { accessToken, refreshToken, sessionId, userId: user.id, memberId: user.member?.id, roles: user.roles };
  }

  setCookies(res: Response, accessToken: string, refreshToken: string) {
    const secure = this.config.get<boolean>('COOKIE_SECURE') ?? false;
    const accessTtl = this.config.get<number>('JWT_ACCESS_TTL') ?? 900;
    const refreshTtl = this.config.get<number>('JWT_REFRESH_TTL') ?? 2592000;
    res.cookie(ACCESS_COOKIE, accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: accessTtl * 1000 });
    res.cookie(REFRESH_COOKIE, refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: '/api', maxAge: refreshTtl * 1000 });
  }

  clearCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/api' });
  }

  async refresh(refreshToken: string) {
    const hash = sha256Hex(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { refreshHash: hash }, include: { user: { include: { member: true } } } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) throw new UnauthorizedException('Invalid session');
    const accessTtl = this.config.get<number>('JWT_ACCESS_TTL') ?? 900;
    const accessToken = await this.jwt.signAsync(
      { sub: session.userId, email: session.user.email, roles: session.user.roles, sessionId: session.id },
      { secret: this.config.get<string>('JWT_ACCESS_SECRET'), expiresIn: accessTtl },
    );
    await this.prisma.session.update({ where: { id: session.id }, data: { lastActiveAt: new Date() } });
    return { accessToken, user: session.user };
  }

  async logout(refreshToken: string | undefined, userId?: string) {
    if (refreshToken) {
      await this.prisma.session.updateMany({
        where: { refreshHash: sha256Hex(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    if (userId) {
      await this.prisma.auditLog.create({ data: { actorId: userId, action: 'auth.logout', target: userId, metadata: {} } });
    }
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { member: true, identityProfile: true },
    });
    if (!user) throw new UnauthorizedException('Unknown user');
    return {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      accountStatus: user.accountStatus,
      membershipStage: user.membershipStage,
      phoneVerified: !!user.phoneVerifiedAt,
      emailVerified: !!user.emailVerifiedAt,
      member: user.member,
      identityStatus: user.identityProfile?.status ?? 'NOT_STARTED',
    };
  }
}
