import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

class CreateDto {
  @IsString() title!: string;
  @IsString() body!: string;
  @IsString() audience!: string;
  @IsString() channel!: string;
  @IsOptional() @IsString() scheduledFor?: string;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  mine(@CurrentUser() user: { sub: string }, @Query('category') category?: string) {
    // Members see their own rows plus admin broadcasts (userId null = all members).
    return this.prisma.notification.findMany({
      where: { OR: [{ userId: user.sub }, { userId: null }], ...(category ? { category } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post('admin')
  async create(@Body() dto: CreateDto, @CurrentUser() admin: { email: string }) {
    void admin;
    return this.prisma.notification.create({
      data: {
        category: 'Updates',
        title: dto.title,
        body: dto.body,
        channel: ((dto.channel?.toUpperCase() ?? 'IN_APP') as never),
        audience: dto.audience,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
        sentAt: dto.scheduledFor ? undefined : new Date(),
      },
    });
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get('admin/all')
  all() {
    return this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
