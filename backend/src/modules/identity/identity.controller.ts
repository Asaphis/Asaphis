import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { identityProviderFor } from './providers';

class SubmitDto {
  @IsString() country!: string;
  @IsString() document!: string;
  @IsString() fileToken!: string;
  @IsOptional() @IsString() fileId?: string;
}
class ReviewDto {
  @IsString() decision!: 'approve' | 'reject' | 'request-info' | 'manual-review';
  @IsOptional() @IsString() note?: string;
}

@ApiTags('identity')
@Controller('identity')
export class IdentityController {
  constructor(private prisma: PrismaService) {}

  @Post('submit')
  async submit(@Body() dto: SubmitDto, @CurrentUser() user: { sub: string }) {
    const provider = identityProviderFor(process.env.IDENTITY_PRIMARY_PROVIDER ?? 'mock');
    const countryCode = dto.country.slice(0, 2).toUpperCase();
    const profile = await this.prisma.identityProfile.upsert({
      where: { userId: user.sub },
      create: { userId: user.sub, countryCode, documentType: dto.document, status: 'SUBMITTED', provider: provider.name },
      update: { countryCode, documentType: dto.document, status: 'SUBMITTED', provider: provider.name },
    });
    const res = await provider.submit({ userId: user.sub, countryCode, documentType: dto.document, fileId: dto.fileId });
    await this.prisma.identityVerification.create({
      data: { profileId: profile.id, provider: provider.name, status: 'PENDING', resultSummary: `ref=${res.reference}` },
    });
    return { status: 'pending' as const, profileId: profile.id };
  }

  @Get('status')
  async status(@CurrentUser() user: { sub: string }) {
    const profile = await this.prisma.identityProfile.findUnique({
      where: { userId: user.sub },
      include: { verifications: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    return profile ?? { status: 'NOT_STARTED' };
  }

  // Admin review — strict roles; raw documents never returned to ordinary admins.
  @Roles('SECURITY_ADMIN', 'SUPER_ADMIN')
  @Get('cases')
  cases() {
    return this.prisma.identityProfile.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: { user: { select: { email: true, member: true } }, verifications: { orderBy: { createdAt: 'desc' }, take: 3 } },
    });
  }

  @Roles('SECURITY_ADMIN', 'SUPER_ADMIN')
  @Post('cases/:id/review')
  async review(@Param('id') id: string, @Body() dto: ReviewDto, @CurrentUser() admin: { sub: string; email: string }) {
    const statusMap = { approve: 'VERIFIED', reject: 'REJECTED', 'request-info': 'NEEDS_REVIEW', 'manual-review': 'PROCESSING' } as const;
    const profile = await this.prisma.identityProfile.update({ where: { id }, data: { status: statusMap[dto.decision] as never } });
    await this.prisma.identityVerification.create({
      data: { profileId: id, provider: profile.provider, status: dto.decision === 'approve' ? 'VERIFIED' : dto.decision === 'reject' ? 'REJECTED' : 'NEEDS_REVIEW', reviewedBy: admin.email, reviewedAt: new Date(), reviewNote: dto.note },
    });
    await this.prisma.adminAuditLog.create({
      data: { adminEmail: admin.email, action: `identity.review.${dto.decision}`, target: id, reason: dto.note },
    });
    return profile;
  }
}
