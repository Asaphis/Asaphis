import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Roles('SECURITY_ADMIN', 'SUPER_ADMIN')
  @Get()
  list(@Query('take') take = '100') {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(Number(take) || 100, 500) });
  }

  @Roles('SECURITY_ADMIN', 'SUPER_ADMIN')
  @Get('admin')
  admin() {
    return this.prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  }
}
