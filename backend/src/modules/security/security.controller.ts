import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('security')
@Controller('security')
@Roles('SECURITY_ADMIN', 'SUPER_ADMIN')
export class SecurityController {
  constructor(private prisma: PrismaService) {}

  @Get('events')
  events() {
    return this.prisma.riskEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  @Post('events/:id/status')
  setEvent(@Param('id') id: string, @Body() body: { status: string }) {
    return this.prisma.riskEvent.update({ where: { id }, data: { status: body.status } });
  }

  @Get('sessions')
  sessions() {
    return this.prisma.session.findMany({ orderBy: { lastActiveAt: 'desc' }, take: 100 });
  }

  @Post('sessions/:id/terminate')
  async terminate(@Param('id') id: string, @CurrentUser() admin: { email: string }) {
    const row = await this.prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'security.session.terminate', target: id } });
    return row;
  }

  @Get('devices')
  devices() {
    return this.prisma.device.findMany({ orderBy: { lastSeenAt: 'desc' }, take: 100 });
  }

  @Post('devices/:id/revoke')
  async revokeDevice(@Param('id') id: string, @CurrentUser() admin: { email: string }) {
    await this.prisma.device.update({ where: { id }, data: { revokedAt: new Date(), trusted: false } });
    await this.prisma.session.updateMany({ where: { deviceId: id }, data: { revokedAt: new Date() } });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'security.device.revoke', target: id } });
    return { revoked: true };
  }
}
