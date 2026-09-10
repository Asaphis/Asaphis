import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { generateOtp, sha256Hex } from '../../common/utils/crypto.util';
import { providerFor } from './providers';

class SendDto {
  @IsString() number!: string;
  @IsIn(['SMS', 'WHATSAPP', 'VOICE', 'EMAIL']) channel!: 'SMS' | 'WHATSAPP' | 'VOICE' | 'EMAIL';
}
class VerifyDto {
  @IsString() challengeId!: string;
  @IsString() code!: string;
}

@ApiTags('phone')
@Controller('phone')
export class PhoneController {
  constructor(private prisma: PrismaService) {}

  @Post('send')
  async send(@Body() dto: SendDto, @CurrentUser() user: { sub: string }) {
    const primary = process.env.PHONE_PRIMARY_PROVIDER ?? 'mock';
    const fallback = process.env.PHONE_FALLBACK_PROVIDER ?? 'mock';
    const otp = generateOtp(Number(process.env.PHONE_OTP_LENGTH ?? 6));
    const ttl = Number(process.env.PHONE_OTP_TTL_SECONDS ?? 300);

    let providerUsed = primary;
    let fallbackUsed = false;
    try {
      await providerFor(primary).send(dto.channel, dto.number, otp);
    } catch {
      await providerFor(fallback).send(dto.channel, dto.number, otp);
      providerUsed = fallback;
      fallbackUsed = true;
    }

    const row = await this.prisma.phoneVerification.create({
      data: {
        userId: user.sub,
        phone: dto.number,
        channel: dto.channel as never,
        provider: providerUsed,
        otpHash: sha256Hex(otp),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
    return { challengeId: row.id, resendAfterSeconds: Number(process.env.PHONE_RESEND_COOLDOWN_SECONDS ?? 60), fallbackUsed };
  }

  @Post('verify')
  async verify(@Body() dto: VerifyDto, @CurrentUser() user: { sub: string }) {
    const row = await this.prisma.phoneVerification.findFirst({ where: { id: dto.challengeId, userId: user.sub } });
    if (!row || row.consumedAt || row.expiresAt < new Date() || row.attempts >= row.maxAttempts) {
      return { verified: false };
    }
    if (sha256Hex(dto.code) !== row.otpHash) {
      await this.prisma.phoneVerification.update({ where: { id: row.id }, data: { attempts: row.attempts + 1 } });
      return { verified: false };
    }
    await this.prisma.phoneVerification.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
    await this.prisma.user.update({ where: { id: user.sub }, data: { phone: row.phone, phoneVerifiedAt: new Date() } });
    return { verified: true };
  }
}
