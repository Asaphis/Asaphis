import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

class CreateTravelDto {
  @IsString() destination!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsString() reason!: string;
  @IsOptional() @IsString() additionalInformation?: string;
}
class ReviewTravelDto {
  @IsString() decision!: 'approve' | 'reject' | 'revoke' | 'request-verification';
  @IsOptional() @IsString() note?: string;
  @IsOptional() features?: string[];
}

@ApiTags('travel')
@Controller('travel')
export class TravelController {
  constructor(private prisma: PrismaService) {}

  @Post('requests')
  async create(@Body() dto: CreateTravelDto, @CurrentUser() user: { sub: string }) {
    const row = await this.prisma.travelRequest.create({
      data: {
        userId: user.sub,
        destination: dto.destination,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        additionalInformation: dto.additionalInformation,
      },
    });
    await this.prisma.auditLog.create({ data: { actorId: user.sub, action: 'travel.request', target: row.id, metadata: { destination: dto.destination } as never } });
    return { id: row.id, status: 'Pending' as const, ...dto };
  }

  @Get('requests')
  mine(@CurrentUser() user: { sub: string }) {
    return this.prisma.travelRequest.findMany({ where: { userId: user.sub }, orderBy: { createdAt: 'desc' }, include: { grants: true } });
  }

  @Roles('SECURITY_ADMIN', 'SUPER_ADMIN')
  @Get('admin/requests')
  all() {
    return this.prisma.travelRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: { select: { email: true, member: { select: { displayName: true, memberCode: true } } } } } });
  }

  @Roles('SECURITY_ADMIN', 'SUPER_ADMIN')
  @Post('admin/requests/:id/review')
  async review(@Param('id') id: string, @Body() dto: ReviewTravelDto, @CurrentUser() admin: { email: string }) {
    const req = await this.prisma.travelRequest.findUniqueOrThrow({ where: { id } });
    if (dto.decision === 'approve') {
      await this.prisma.travelRequest.update({ where: { id }, data: { status: 'APPROVED', decidedBy: admin.email, decidedAt: new Date(), decisionNote: dto.note } });
      await this.prisma.travelAccessGrant.create({
        data: { travelRequestId: id, userId: req.userId, destination: req.destination, startsAt: req.startDate, endsAt: req.endDate, features: dto.features ?? ['read:member', 'request:support'] },
      });
    } else if (dto.decision === 'reject') {
      await this.prisma.travelRequest.update({ where: { id }, data: { status: 'REJECTED', decidedBy: admin.email, decidedAt: new Date(), decisionNote: dto.note } });
    } else if (dto.decision === 'revoke') {
      await this.prisma.travelRequest.update({ where: { id }, data: { status: 'REVOKED' } });
      await this.prisma.travelAccessGrant.updateMany({ where: { travelRequestId: id }, data: { revokedAt: new Date() } });
    }
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: `travel.${dto.decision}`, target: id, reason: dto.note } });
    return this.prisma.travelRequest.findUnique({ where: { id }, include: { grants: true } });
  }
}
