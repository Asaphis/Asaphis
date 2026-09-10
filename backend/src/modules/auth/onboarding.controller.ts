import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { generateOtp, sha256Hex } from '../../common/utils/crypto.util';

class SendPhoneDto {
  @IsString() number!: string;
  @IsIn(['SMS', 'WHATSAPP', 'VOICE', 'EMAIL']) channel!: 'SMS' | 'WHATSAPP' | 'VOICE' | 'EMAIL';
}
class VerifyPhoneDto {
  @IsString() challengeId!: string;
  @IsString() code!: string;
}
class SubmitIdentityDto {
  @IsString() country!: string;
  @IsString() document!: string;
  @IsString() fileToken!: string;
}
class ContributionDto {
  @IsNumber() amount!: number;
  @IsString() currency!: string;
  @IsString() method!: string;
}

/**
 * Bridges the user-frontend JoinJourney (7 steps) to backend state machine:
 * REGISTERED -> PHONE_VERIFICATION -> IDENTITY_VERIFICATION -> ELIGIBILITY -> SECURITY -> CONTRIBUTION -> ACTIVE
 */
@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('detect-country')
  detect() {
    // Real IP-intel lives in GeoModule (/geo/lookup); V1 default keeps UX unblocked.
    return { country: 'Nigeria', source: 'mock' };
  }

  @Public()
  @Get('country-config/:country')
  async countryConfig(@Param('country') country: string) {
    const code = country.slice(0, 2).toUpperCase();
    const row = await this.prisma.country.findUnique({ where: { code } });
    if (row) {
      return {
        country: row.name,
        identityDocuments: row.allowedDocuments,
        contribution: {
          currency: row.currency,
          amount: Number(row.contributionAmount ?? 0),
          methods: row.paymentMethods,
          usesGlobalFallback: row.usesGlobalFallback,
        },
        phoneChannels: row.phoneRequired ? ['SMS', 'WHATSAPP', 'VOICE'] : ['SMS'],
      };
    }
    const fallback: Record<string, unknown> = {
      Nigeria: { identityDocuments: ["NIN", "Passport", "Driver's Licence"], contribution: { currency: 'NGN', amount: 25000, methods: ['Card', 'Transfer', 'Mobile money'], usesGlobalFallback: false }, phoneChannels: ['SMS', 'WHATSAPP', 'VOICE'] },
      Ghana: { identityDocuments: ['Ghana Card', 'Passport'], contribution: { currency: 'GHS', amount: 350, methods: ['Card', 'Transfer', 'Mobile money'], usesGlobalFallback: false }, phoneChannels: ['SMS', 'WHATSAPP'] },
      Kenya: { identityDocuments: ['National ID', 'Passport'], contribution: { currency: 'KES', amount: 3200, methods: ['Card', 'Transfer', 'Mobile money'], usesGlobalFallback: false }, phoneChannels: ['SMS', 'WHATSAPP'] },
    };
    return { country, ...((fallback[country] ?? fallback['Nigeria']) as object) };
  }

  @Post('phone/send')
  async sendPhone(@Body() dto: SendPhoneDto, @CurrentUser() user: { sub: string }) {
    const ttl = Number(process.env.PHONE_OTP_TTL_SECONDS ?? 300);
    const otp = generateOtp(6);
    const row = await this.prisma.phoneVerification.create({
      data: {
        userId: user.sub,
        phone: dto.number,
        channel: dto.channel as never,
        provider: process.env.PHONE_PRIMARY_PROVIDER ?? 'mock',
        otpHash: sha256Hex(otp),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
    // Mock provider: in production enqueue SMS via BullMQ here. Never log OTP outside dev.
    if ((process.env.NODE_ENV ?? 'development') !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[phone:mock] otp for ${dto.number} = ${otp}`);
    }
    return { challengeId: row.id, resendAfterSeconds: Number(process.env.PHONE_RESEND_COOLDOWN_SECONDS ?? 60) };
  }

  @Post('phone/verify')
  async verifyPhone(@Body() dto: VerifyPhoneDto, @CurrentUser() user: { sub: string }) {
    const row = await this.prisma.phoneVerification.findFirst({ where: { id: dto.challengeId, userId: user.sub } });
    if (!row || row.consumedAt || row.expiresAt < new Date()) return { verified: false };
    if (row.attempts >= row.maxAttempts) return { verified: false };
    if (sha256Hex(dto.code) !== row.otpHash) {
      await this.prisma.phoneVerification.update({ where: { id: row.id }, data: { attempts: row.attempts + 1 } });
      return { verified: false };
    }
    await this.prisma.phoneVerification.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
    await this.prisma.user.update({
      where: { id: user.sub },
      data: { phone: row.phone, phoneVerifiedAt: new Date(), membershipStage: 'IDENTITY_VERIFICATION' },
    });
    await this.prisma.identityProfile.upsert({
      where: { userId: user.sub },
      create: { userId: user.sub, status: 'PHONE_VERIFIED' },
      update: { status: 'PHONE_VERIFIED' },
    });
    return { verified: true };
  }

  @Post('identity/submit')
  async submitIdentity(@Body() dto: SubmitIdentityDto, @CurrentUser() user: { sub: string }) {
    const profile = await this.prisma.identityProfile.upsert({
      where: { userId: user.sub },
      create: { userId: user.sub, countryCode: dto.country.slice(0, 2).toUpperCase(), documentType: dto.document, status: 'SUBMITTED' },
      update: { countryCode: dto.country.slice(0, 2).toUpperCase(), documentType: dto.document, status: 'SUBMITTED' },
    });
    await this.prisma.identityVerification.create({
      data: { profileId: profile.id, provider: process.env.IDENTITY_PRIMARY_PROVIDER ?? 'mock', status: 'PENDING', resultSummary: 'Queued with provider' },
    });
    await this.prisma.user.update({ where: { id: user.sub }, data: { membershipStage: 'ELIGIBILITY_CHECK' } });
    return { status: 'pending' as const, profileId: profile.id };
  }

  @Post('security-check')
  async securityCheck(@CurrentUser() user: { sub: string }) {
    // Risk engine evaluates device/country/signals; V1 passes when no open CRITICAL events.
    const critical = await this.prisma.riskEvent.count({ where: { userId: user.sub, level: 'CRITICAL', status: 'open' } });
    const passed = critical === 0;
    if (passed) {
      await this.prisma.user.update({ where: { id: user.sub }, data: { membershipStage: 'CONTRIBUTION' } });
    }
    return { passed };
  }

  @Post('contribution')
  async contribution(@Body() dto: ContributionDto, @CurrentUser() user: { sub: string }) {
    const payment = await this.prisma.payment.create({
      data: { userId: user.sub, amount: dto.amount, currency: dto.currency, method: dto.method, status: 'PENDING', metadata: { onboarding: true } },
    });
    return { id: payment.id, status: 'Pending' as const };
  }

  @Get('activation')
  async activation(@CurrentUser() user: { sub: string }) {
    const u = await this.prisma.user.findUnique({ where: { id: user.sub }, include: { member: true } });
    const active = u?.membershipStage === 'ACTIVE_MEMBER';
    return { active, memberId: u?.member?.id, stage: u?.membershipStage };
  }

  // Compat aliases for older user-frontend contract names
  @Public() @Get('country/detect') detectAlias() { return this.detect(); }
  @Post('phone-code/send') sendAlias(@Body() dto: SendPhoneDto, @CurrentUser() u: { sub: string }) { return this.sendPhone(dto, u); }
  @Post('phone-code/verify') verifyAlias(@Body() dto: VerifyPhoneDto, @CurrentUser() u: { sub: string }) { return this.verifyPhone(dto, u); }
}
