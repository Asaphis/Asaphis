import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

class ApplyDto {
  @IsString() memberId!: string; // userId
  @IsString() type!: string;
  @IsString() reason!: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsArray() affectedFeatures?: string[];
}

@ApiTags('restrictions')
@Controller('restrictions')
export class RestrictionsController {
  constructor(private prisma: PrismaService) {}

  @Roles('MODERATOR', 'SECURITY_ADMIN', 'SUPER_ADMIN')
  @Post()
  async apply(@Body() dto: ApplyDto, @CurrentUser() admin: { email: string }) {
    const expiresAt = dto.duration === '7d' ? new Date(Date.now() + 7 * 86400_000) : undefined;
    const row = await this.prisma.restriction.create({
      data: { userId: dto.memberId, type: dto.type as never, reason: dto.reason, affectedFeatures: dto.affectedFeatures ?? [], appliedBy: admin.email, expiresAt },
    });
    await this.prisma.restrictionHistory.create({ data: { restrictionId: row.id, action: 'applied', actor: admin.email, note: dto.reason } });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'restriction.apply', target: row.id, reason: dto.reason } });
    return row;
  }

  @Roles('MODERATOR', 'SECURITY_ADMIN', 'SUPER_ADMIN')
  @Post(':id/lift')
  async lift(@Param('id') id: string, @CurrentUser() admin: { email: string }) {
    const row = await this.prisma.restriction.update({ where: { id }, data: { active: false, liftedAt: new Date(), liftedBy: admin.email } });
    await this.prisma.restrictionHistory.create({ data: { restrictionId: id, action: 'lifted', actor: admin.email } });
    return row;
  }

  @Roles('MODERATOR', 'SECURITY_ADMIN', 'SUPER_ADMIN')
  @Get()
  list() {
    return this.prisma.restriction.findMany({ orderBy: { appliedAt: 'desc' }, take: 100 });
  }
}
