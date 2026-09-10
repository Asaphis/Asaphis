import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

class CreateDto {
  @IsString() category!: string;
  @IsString() subject!: string;
  @IsString() message!: string;
}

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private prisma: PrismaService) {}

  @Post('requests')
  async create(@Body() dto: CreateDto, @CurrentUser() user: { sub: string; email: string }) {
    const row = await this.prisma.supportRequest.create({
      data: { userId: user.sub, email: user.email, category: dto.category, subject: dto.subject, status: 'OPEN', messages: { create: { author: user.email, authorRole: 'member', body: dto.message } } },
      include: { messages: true },
    });
    return { id: row.id, status: 'open' as const, createdAt: row.createdAt, responses: [] };
  }

  @Get('requests')
  mine(@CurrentUser() user: { sub: string }) {
    return this.prisma.supportRequest.findMany({ where: { userId: user.sub }, include: { messages: true }, orderBy: { createdAt: 'desc' } });
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SECURITY_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN')
  @Get('admin/tickets')
  tickets(@Query('status') status?: string) {
    return this.prisma.supportRequest.findMany({
      where: status && status !== 'all' ? { status: status.toUpperCase() as never } : {},
      include: { messages: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SECURITY_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN')
  @Post('admin/tickets/:id/reply')
  async reply(@Param('id') id: string, @Body() body: { body: string }, @CurrentUser() admin: { email: string; roles: string[] }) {
    await this.prisma.supportMessage.create({ data: { requestId: id, author: admin.email, authorRole: admin.roles?.[0] ?? 'admin', body: body.body } });
    return this.prisma.supportRequest.update({ where: { id }, data: { status: 'IN_PROGRESS' }, include: { messages: true } });
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SECURITY_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN')
  @Post('admin/tickets/:id/status')
  setStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.prisma.supportRequest.update({ where: { id }, data: { status: body.status.toUpperCase() as never }, include: { messages: true } });
  }
}
