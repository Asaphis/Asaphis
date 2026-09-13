import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class LandingUpdateDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsBoolean() visible?: boolean;
  @IsOptional() sortOrder?: number;
}

class LandingOrderDto {
  @IsArray() @IsString({ each: true }) ids!: string[];
}

class CommunitySettingsDto {
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() telegram?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() postingRules?: string;
  @IsOptional() @IsString() commentRules?: string;
  @IsOptional() @IsString() submissionRequirements?: string;
  @IsOptional() @IsString() moderationPolicy?: string;
}

const COMMUNITY_KEYS = [
  'WHATSAPP_COMMUNITY_URL',
  'TELEGRAM_COMMUNITY_URL',
  'COMMUNITY_DESCRIPTION',
  'SUPPORT_REASONS',
  'COMMUNITY_POSTING_RULES',
  'COMMUNITY_COMMENT_RULES',
  'COMMUNITY_SUBMISSION_REQUIREMENTS',
  'COMMUNITY_MODERATION_POLICY',
] as const;

const COMMUNITY_FIELD_TO_KEY: Record<string, string> = {
  whatsapp: 'WHATSAPP_COMMUNITY_URL',
  telegram: 'TELEGRAM_COMMUNITY_URL',
  description: 'COMMUNITY_DESCRIPTION',
  postingRules: 'COMMUNITY_POSTING_RULES',
  commentRules: 'COMMUNITY_COMMENT_RULES',
  submissionRequirements: 'COMMUNITY_SUBMISSION_REQUIREMENTS',
  moderationPolicy: 'COMMUNITY_MODERATION_POLICY',
};

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('public')
  async public() {
    const rows = await this.prisma.appSetting.findMany({ where: { key: { in: [...COMMUNITY_KEYS] } } });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  // Landing page structure for the admin Landing builder (real rows, seeded).
  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get('landing')
  landing() {
    return this.prisma.landingSection.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Put('landing')
  async reorderLanding(@Body() dto: LandingOrderDto, @CurrentUser() admin: { email: string }) {
    await Promise.all(
      dto.ids.map((key, index) =>
        this.prisma.landingSection.updateMany({ where: { key }, data: { sortOrder: index + 1 } }),
      ),
    );
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'settings.landing.reorder', target: 'landing' } });
    return this.prisma.landingSection.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Put('landing/:key')
  async updateLanding(@Param('key') key: string, @Body() dto: LandingUpdateDto, @CurrentUser() admin: { email: string }) {
    const row = await this.prisma.landingSection.update({
      where: { key },
      data: { ...(dto.title !== undefined ? { title: dto.title } : {}), ...(dto.visible !== undefined ? { visible: dto.visible } : {}), ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}) },
    });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'settings.landing.update', target: key } });
    return row;
  }

  // Community links/rules for the admin Community page (stored as app settings).
  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Put('community')
  async updateCommunity(@Body() dto: CommunitySettingsDto, @CurrentUser() admin: { email: string }) {
    const entries = Object.entries(dto).filter(([, v]) => v !== undefined && String(v).trim() !== '');
    for (const [field, value] of entries) {
      const key = COMMUNITY_FIELD_TO_KEY[field];
      if (!key) continue;
      await this.prisma.appSetting.upsert({ where: { key }, create: { key, value: String(value), updatedBy: admin.email }, update: { value: String(value), updatedBy: admin.email } });
    }
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'settings.community.update', target: 'community' } });
    const rows = await this.prisma.appSetting.findMany({ where: { key: { in: [...COMMUNITY_KEYS] } } });
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
