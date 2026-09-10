import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('devices')
@Controller('me/devices')
export class DevicesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }) {
    return this.prisma.device.findMany({ where: { userId: user.sub }, orderBy: { lastSeenAt: 'desc' } });
  }

  @Delete(':id')
  async revoke(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    await this.prisma.device.updateMany({ where: { id, userId: user.sub }, data: { revokedAt: new Date(), trusted: false } });
    await this.prisma.session.updateMany({ where: { deviceId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { revoked: true };
  }
}
