import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

class SubmitDto {
  @IsString() title!: string;
  @IsString() body!: string;
}
class CommentDto {
  @IsString() targetKind!: string;
  @IsString() targetId!: string;
  @IsOptional() @IsString() parentId?: string;
  @IsString() body!: string;
}
class ReviewDto {
  @IsString() decision!: 'approve' | 'reject' | 'request-changes' | 'schedule' | 'publish';
  @IsOptional() @IsString() note?: string;
}

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private prisma: PrismaService) {}

  @Post('submissions')
  async submit(@Body() dto: SubmitDto, @CurrentUser() user: { sub: string; email: string }) {
    // Trusted-member low-risk fast path is feature-flagged; suspicious content always held.
    const ff = await this.prisma.featureFlag.findUnique({ where: { key: 'TRUSTED_MEMBER_AUTO_PUBLISH' } });
    const suspicious = /https?:\/\/|spam|viagra|crypto.*doubling/i.test(`${dto.title} ${dto.body}`);
    const status = ff?.enabled && !suspicious ? 'APPROVED' : 'UNDER_REVIEW';
    const row = await this.prisma.contentSubmission.create({
      data: { authorId: user.sub, authorName: user.email, title: dto.title, body: dto.body, status: status as never },
    });
    return { id: row.id, title: row.title, body: row.body, status: row.status === 'APPROVED' ? 'Approved' : 'Under Review', updatedAt: row.updatedAt };
  }

  @Get('submissions')
  mine(@CurrentUser() user: { sub: string }) {
    return this.prisma.contentSubmission.findMany({ where: { authorId: user.sub }, orderBy: { createdAt: 'desc' } });
  }

  @Post('comments')
  async comment(@Body() dto: CommentDto, @CurrentUser() user: { sub: string; email: string }) {
    return this.prisma.comment.create({
      data: { authorId: user.sub, authorName: user.email, targetKind: dto.targetKind, targetId: dto.targetId, parentId: dto.parentId, body: dto.body, status: 'pending' },
    });
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get('admin/submissions')
  adminList(@Query('status') status?: string) {
    return this.prisma.contentSubmission.findMany({
      where: status && status !== 'all' ? { status: status.toUpperCase().replace('-', '_') as never } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post('admin/submissions/:id/review')
  async review(@Param('id') id: string, @Body() dto: ReviewDto, @CurrentUser() admin: { email: string; roles: string[] }) {
    const map = { approve: 'APPROVED', reject: 'REJECTED', 'request-changes': 'CHANGES_REQUESTED', schedule: 'SCHEDULED', publish: 'PUBLISHED' } as const;
    const row = await this.prisma.contentSubmission.update({ where: { id }, data: { status: map[dto.decision] as never, reviewerNote: dto.note, decidedBy: admin.email, decidedAt: new Date() } });
    await this.prisma.moderationAction.create({ data: { actor: admin.email, actorRole: admin.roles?.[0], targetKind: 'submission', targetId: id, action: dto.decision, note: dto.note } });
    await this.prisma.notification.create({ data: { userId: row.authorId, category: 'Moderation', title: `Submission ${dto.decision}`, body: dto.note ?? row.title } });
    return row;
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get('admin/comments')
  comments(@Query('status') status?: string) {
    return this.prisma.comment.findMany({ where: status && status !== 'all' ? { status } : {}, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post('admin/comments/:id/review')
  async reviewComment(@Param('id') id: string, @Body() dto: { action: 'approve' | 'hide' | 'delete' | 'warn'; note?: string }, @CurrentUser() admin: { email: string }) {
    if (dto.action === 'delete') {
      await this.prisma.comment.delete({ where: { id } });
      return { deleted: true };
    }
    const status = dto.action === 'approve' ? 'approved' : dto.action === 'hide' ? 'hidden' : 'flagged';
    const row = await this.prisma.comment.update({ where: { id }, data: { status } });
    await this.prisma.moderationAction.create({ data: { actor: admin.email, targetKind: 'comment', targetId: id, action: dto.action, note: dto.note } });
    return row;
  }
}
