import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('public')
  async public() {
    const keys = ['WHATSAPP_COMMUNITY_URL', 'TELEGRAM_COMMUNITY_URL', 'COMMUNITY_DESCRIPTION', 'SUPPORT_REASONS'];
    const rows = await this.prisma.appSetting.findMany({ where: { key: { in: keys } } });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  @Roles('SUPER_ADMIN')
  @Get('flags')
  flags() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  @Roles('SUPER_ADMIN')
  @Put('flags/:key')
  async setFlag(@Param('key') key: string, @Body() body: { enabled: boolean }, @CurrentUser() admin: { email: string }) {
    return this.prisma.featureFlag.upsert({ where: { key }, create: { key, enabled: body.enabled, updatedBy: admin.email }, update: { enabled: body.enabled, updatedBy: admin.email } });
  }

  @Roles('SUPER_ADMIN')
  @Get()
  all() {
    return this.prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  }

  @Roles('SUPER_ADMIN')
  @Put(':key')
  async set(@Param('key') key: string, @Body() body: { value: unknown }, @CurrentUser() admin: { email: string }) {
    const row = await this.prisma.appSetting.upsert({ where: { key }, create: { key, value: body.value as never, updatedBy: admin.email }, update: { value: body.value as never, updatedBy: admin.email } });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'settings.update', target: key, newState: { value: body.value } as never } });
    return row;
  }
}
