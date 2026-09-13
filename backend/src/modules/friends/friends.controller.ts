import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MESSAGING_BLOCK_TYPES,
  assertAccountUsable,
  assertNoRestriction,
  blockedIds,
  displayNameOf,
  initialsOf,
  isVerifiedMember,
} from '../social/social-access';

class RequestDto {
  @IsString() userId!: string;
}

@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  constructor(private prisma: PrismaService) {}

  private card(user: { id: string; email?: string; member?: { displayName?: string; memberCode?: string; currentCountry?: string | null; citizenshipCountry?: string | null } | null }) {
    const name = displayNameOf(user.email, user.member?.displayName);
    return {
      id: user.id,
      displayName: name,
      memberCode: user.member?.memberCode ?? '',
      country: user.member?.currentCountry ?? user.member?.citizenshipCountry ?? '',
      initials: initialsOf(name),
    };
  }

  private async requireVerified(userId: string, roles: string[]) {
    await assertAccountUsable(this.prisma, userId);
    if (!(await isVerifiedMember(this.prisma, userId, roles))) {
      throw new ForbiddenException('Verify your identity to connect with members.');
    }
  }

  /** Search verified members. Never exposes email or phone. */
  @Get('search')
  async search(@Query('q') q: string, @CurrentUser() user: { sub: string }) {
    const needle = String(q ?? '').trim();
    if (needle.length < 2) return [];
    const blocked = await blockedIds(this.prisma, user.sub);
    const rows = await this.prisma.user.findMany({
      where: {
        id: { notIn: [user.sub, ...blocked] },
        OR: [
          { member: { displayName: { contains: needle, mode: 'insensitive' } } },
          { member: { memberCode: { contains: needle, mode: 'insensitive' } } },
        ],
      },
      select: { id: true, email: true, member: { select: { displayName: true, memberCode: true, currentCountry: true, citizenshipCountry: true } }, identityProfile: { select: { status: true } }, roles: true },
      take: 20,
    });
    return rows
      .filter((r) => r.identityProfile?.status === 'VERIFIED' || (r.roles ?? []).some((x) => x !== 'MEMBER'))
      .map((r) => this.card(r));
  }

  @Post('requests')
  async request(@Body() dto: RequestDto, @CurrentUser() user: { sub: string; email: string; roles: string[] }) {
    await this.requireVerified(user.sub, user.roles);
    await assertNoRestriction(this.prisma, user.sub, MESSAGING_BLOCK_TYPES);
    if (dto.userId === user.sub) throw new BadRequestException('You cannot add yourself.');
    const target = await this.prisma.user.findUnique({ where: { id: dto.userId }, include: { identityProfile: true } });
    if (!target) throw new NotFoundException('Member not found');
    const blocked = await blockedIds(this.prisma, user.sub);
    if (blocked.includes(dto.userId)) throw new ForbiddenException('Not allowed');
    const existing = await this.prisma.friendship.findFirst({
      where: { OR: [{ requesterId: user.sub, addresseeId: dto.userId }, { requesterId: dto.userId, addresseeId: user.sub }] },
    });
    if (existing) {
      if (existing.status === 'BLOCKED') throw new ForbiddenException('Not allowed');
      if (existing.status === 'ACCEPTED') throw new BadRequestException('Already friends.');
      if (existing.status === 'PENDING') throw new BadRequestException('Request already pending.');
      await this.prisma.friendship.update({ where: { id: existing.id }, data: { status: 'PENDING', requesterId: user.sub, addresseeId: dto.userId } });
      return { id: existing.id, status: 'PENDING' as const };
    }
    const row = await this.prisma.friendship.create({ data: { requesterId: user.sub, addresseeId: dto.userId, status: 'PENDING' } });
    await this.prisma.notification.create({
      data: { userId: dto.userId, category: 'Social', title: 'New friend request', body: `${displayNameOf(user.email)} wants to connect.` },
    }).catch(() => null);
    return { id: row.id, status: 'PENDING' as const };
  }

  @Get('requests')
  async incoming(@CurrentUser() user: { sub: string }) {
    const rows = await this.prisma.friendship.findMany({
      where: { addresseeId: user.sub, status: 'PENDING' },
      include: { requester: { select: { id: true, email: true, member: { select: { displayName: true, memberCode: true, currentCountry: true, citizenshipCountry: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({ id: r.id, createdAt: r.createdAt, requester: this.card(r.requester) }));
  }

  @Post('requests/:id/accept')
  async accept(@Param('id') id: string, @CurrentUser() user: { sub: string; email: string }) {
    const row = await this.prisma.friendship.findUnique({ where: { id } });
    if (!row || row.addresseeId !== user.sub || row.status !== 'PENDING') throw new NotFoundException('Request not found');
    await this.prisma.friendship.update({ where: { id }, data: { status: 'ACCEPTED' } });
    await this.prisma.notification.create({
      data: { userId: row.requesterId, category: 'Social', title: 'Friend request accepted', body: `${displayNameOf(user.email)} accepted your request.` },
    }).catch(() => null);
    return { id, status: 'ACCEPTED' as const };
  }

  @Post('requests/:id/decline')
  async decline(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    const row = await this.prisma.friendship.findUnique({ where: { id } });
    if (!row || row.addresseeId !== user.sub || row.status !== 'PENDING') throw new NotFoundException('Request not found');
    await this.prisma.friendship.update({ where: { id }, data: { status: 'DECLINED' } });
    return { id, status: 'DECLINED' as const };
  }

  @Get()
  async list(@CurrentUser() user: { sub: string }) {
    const rows = await this.prisma.friendship.findMany({
      where: { status: 'ACCEPTED', OR: [{ requesterId: user.sub }, { addresseeId: user.sub }] },
      include: {
        requester: { select: { id: true, email: true, member: { select: { displayName: true, memberCode: true, currentCountry: true, citizenshipCountry: true } } } },
        addressee: { select: { id: true, email: true, member: { select: { displayName: true, memberCode: true, currentCountry: true, citizenshipCountry: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.card(r.requesterId === user.sub ? r.addressee : r.requester));
  }

  @Delete(':userId')
  async remove(@Param('userId') userId: string, @CurrentUser() user: { sub: string }) {
    await this.prisma.friendship.deleteMany({
      where: { status: { in: ['ACCEPTED', 'DECLINED', 'PENDING'] }, OR: [{ requesterId: user.sub, addresseeId: userId }, { requesterId: userId, addresseeId: user.sub }] },
    });
    return { ok: true };
  }

  @Post(':userId/block')
  async block(@Param('userId') userId: string, @CurrentUser() user: { sub: string }) {
    if (userId === user.sub) throw new BadRequestException('You cannot block yourself.');
    await this.prisma.friendship.deleteMany({
      where: { OR: [{ requesterId: user.sub, addresseeId: userId }, { requesterId: userId, addresseeId: user.sub }] },
    });
    await this.prisma.friendship.create({ data: { requesterId: user.sub, addresseeId: userId, status: 'BLOCKED' } });
    return { ok: true };
  }
}
