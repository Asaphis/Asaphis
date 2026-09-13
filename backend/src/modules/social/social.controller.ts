import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  COMMENT_BLOCK_TYPES,
  POSTING_BLOCK_TYPES,
  activeGroupIds,
  assertAccountUsable,
  assertNoRestriction,
  blockedIds,
  displayNameOf,
  friendIds,
  initialsOf,
  isVerifiedMember,
} from './social-access';

class CreatePostDto {
  @IsString() body!: string;
  @IsOptional() @IsArray() mediaUrls?: string[];
  @IsOptional() @IsString() mediaKind?: string;
  @IsOptional() @IsString() visibility?: string;
  @IsOptional() @IsString() groupId?: string;
}

class CreateCommentDto {
  @IsString() body!: string;
  @IsOptional() @IsString() parentId?: string;
}

class CreateReportDto {
  @IsString() targetKind!: string;
  @IsString() targetId!: string;
  @IsString() reason!: string;
  @IsOptional() @IsString() details?: string;
}

class ReviewPostDto {
  @IsString() decision!: 'approve' | 'reject' | 'request-changes' | 'publish';
  @IsOptional() @IsString() note?: string;
}

class ReviewReportDto {
  @IsString() decision!: 'resolve' | 'dismiss';
  @IsOptional() @IsString() postAction?: 'hide' | 'keep';
  @IsOptional() @IsString() note?: string;
}

class ReviewCommentDto {
  @IsString() decision!: 'approve' | 'hide';
}

const VISIBILITIES = ['PUBLIC', 'FRIENDS', 'GROUP', 'MEMBERS'] as const;
const STAFF = ['MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN'];

@ApiTags('social')
@Controller('social')
export class SocialController {
  constructor(private prisma: PrismaService) {}

  private authorCard(user: { id: string; email?: string; member?: { displayName?: string; memberCode?: string } | null }) {
    const name = displayNameOf(user.email, user.member?.displayName);
    return { id: user.id, displayName: name, memberCode: user.member?.memberCode ?? '', initials: initialsOf(name) };
  }

  private mapPost(
    row: Record<string, never>,
    viewerId: string,
    liked: Set<string>,
  ) {
    const author = row.author as { id: string; email?: string; member?: { displayName?: string; memberCode?: string } | null };
    const origin = row.originPost as
      | { id: string; body?: string; author?: { email?: string; member?: { displayName?: string } | null } }
      | null
      | undefined;
    return {
      id: row.id,
      author: this.authorCard(author),
      group: row.group ? { id: (row.group as { id: string }).id, name: (row.group as { name: string }).name } : null,
      origin: origin
        ? {
            id: origin.id,
            body: String(origin.body ?? ''),
            authorName: displayNameOf(origin.author?.email, origin.author?.member?.displayName),
          }
        : null,
      body: row.body,
      mediaUrls: row.mediaUrls,
      mediaKind: row.mediaKind,
      visibility: row.visibility,
      status: row.status,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      repostCount: row.repostCount,
      likedByMe: liked.has(String(row.id)),
      reviewerNote: row.authorId === viewerId ? (row.reviewerNote ?? null) : undefined,
      createdAt: row.createdAt,
    };
  }

  private postInclude() {
    return {
      author: { select: { id: true, email: true, member: { select: { displayName: true, memberCode: true } } } },
      group: { select: { id: true, name: true } },
      originPost: { select: { id: true, body: true, author: { select: { email: true, member: { select: { displayName: true } } } } } },
    };
  }

  private async likedSet(viewerId: string, postIds: string[]): Promise<Set<string>> {
    if (!postIds.length) return new Set();
    const rows = await this.prisma.postLike.findMany({ where: { userId: viewerId, postId: { in: postIds } }, select: { postId: true } });
    return new Set(rows.map((r) => r.postId));
  }

  // ---------- create ----------

  @Post('posts')
  async createPost(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: { sub: string; email: string; roles: string[] },
  ) {
    await assertAccountUsable(this.prisma, user.sub);
    const verified = await isVerifiedMember(this.prisma, user.sub, user.roles);
    if (!verified) throw new ForbiddenException('Verify your identity before posting.');
    await assertNoRestriction(this.prisma, user.sub, POSTING_BLOCK_TYPES);
    const visibility = String(dto.visibility ?? 'MEMBERS').toUpperCase();
    if (!(VISIBILITIES as readonly string[]).includes(visibility)) throw new BadRequestException('Invalid visibility');
    if (!dto.body?.trim() && !(dto.mediaUrls ?? []).length) throw new BadRequestException('Write something or attach media.');
    let groupId: string | undefined;
    if (dto.groupId) {
      const membership = await this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: dto.groupId, userId: user.sub } } });
      const staff = (user.roles ?? []).some((r) => ['MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(r));
      if ((!membership || membership.status !== 'active') && !staff) throw new ForbiddenException('Join the group before posting to it.');
      if (visibility !== 'GROUP') throw new BadRequestException('Group posts must use GROUP visibility.');
      groupId = dto.groupId;
    } else if (visibility === 'GROUP') {
      throw new BadRequestException('GROUP visibility needs a groupId.');
    }
    const staffAuthor = (user.roles ?? []).some((r) => STAFF.includes(r));
    const row = await this.prisma.post.create({
      data: {
        authorId: user.sub,
        groupId,
        body: dto.body.trim().slice(0, 5000),
        mediaUrls: (dto.mediaUrls ?? []).slice(0, 6),
        mediaKind: dto.mediaKind ?? 'text',
        visibility: visibility as never,
        status: staffAuthor ? 'PUBLISHED' : 'UNDER_REVIEW',
      },
      include: this.postInclude(),
    });
    return this.mapPost(row as never, user.sub, new Set());
  }

  // ---------- feed ----------

  @Get('feed')
  async feed(
    @CurrentUser() user: { sub: string },
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    const limit = Math.min(Math.max(Number(take) || 20, 1), 50);
    const [friends, groups, blocked] = await Promise.all([
      friendIds(this.prisma, user.sub),
      activeGroupIds(this.prisma, user.sub),
      blockedIds(this.prisma, user.sub),
    ]);
    const rows = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        authorId: { notIn: blocked },
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'MEMBERS' },
          { authorId: user.sub },
          { visibility: 'FRIENDS', authorId: { in: friends } },
          { visibility: 'GROUP', groupId: { in: groups } },
        ],
      },
      include: this.postInclude(),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit + 1,
    });
    const page = rows.slice(0, limit);
    const liked = await this.likedSet(user.sub, page.map((p) => p.id));
    return {
      items: page.map((p) => this.mapPost(p as never, user.sub, liked)),
      nextCursor: rows.length > limit ? page[page.length - 1].id : null,
    };
  }

  @Get('posts/mine')
  async mine(@CurrentUser() user: { sub: string }) {
    const rows = await this.prisma.post.findMany({
      where: { authorId: user.sub },
      include: this.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const liked = await this.likedSet(user.sub, rows.map((p) => p.id));
    return rows.map((p) => this.mapPost(p as never, user.sub, liked));
  }

  @Get('posts/:id')
  async one(@Param('id') id: string, @CurrentUser() user: { sub: string; roles: string[] }) {
    const row = await this.prisma.post.findUnique({ where: { id }, include: this.postInclude() });
    if (!row) throw new NotFoundException('Post not found');
    const staff = (user.roles ?? []).some((r) => STAFF.includes(r));
    if (row.status !== 'PUBLISHED' && row.authorId !== user.sub && !staff) throw new NotFoundException('Post not found');
    const liked = await this.likedSet(user.sub, [row.id]);
    return this.mapPost(row as never, user.sub, liked);
  }

  @Delete('posts/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: { sub: string; roles: string[] }) {
    const row = await this.prisma.post.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Post not found');
    const staff = (user.roles ?? []).some((r) => STAFF.includes(r));
    if (row.authorId !== user.sub && !staff) throw new ForbiddenException('Not allowed');
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- likes ----------

  @Post('posts/:id/like')
  async like(@Param('id') id: string, @CurrentUser() user: { sub: string; roles: string[] }) {
    await assertAccountUsable(this.prisma, user.sub);
    if (!(await isVerifiedMember(this.prisma, user.sub, user.roles))) throw new ForbiddenException('Verify your identity first.');
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.status !== 'PUBLISHED') throw new NotFoundException('Post not found');
    const existing = await this.prisma.postLike.findUnique({ where: { userId_postId: { userId: user.sub, postId: id } } });
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.postLike.create({ data: { userId: user.sub, postId: id } }),
        this.prisma.post.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
      ]);
    }
    const count = await this.prisma.postLike.count({ where: { postId: id } });
    await this.prisma.post.update({ where: { id }, data: { likeCount: count } });
    return { liked: true, likeCount: count };
  }

  @Delete('posts/:id/like')
  async unlike(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    await this.prisma.postLike.deleteMany({ where: { userId: user.sub, postId: id } });
    const count = await this.prisma.postLike.count({ where: { postId: id } });
    await this.prisma.post.update({ where: { id }, data: { likeCount: count } }).catch(() => null);
    return { liked: false, likeCount: count };
  }

  // ---------- comments ----------

  @Get('posts/:id/comments')
  async comments(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    const rows = await this.prisma.postComment.findMany({
      where: { postId: id, OR: [{ status: 'approved' }, { authorId: user.sub }] },
      include: { author: { select: { id: true, email: true, member: { select: { displayName: true } } } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    return rows.map((c) => ({
      id: c.id,
      postId: c.postId,
      parentId: c.parentId,
      body: c.body,
      status: c.status,
      likeCount: c.likeCount,
      createdAt: c.createdAt,
      authorName: c.authorName ?? displayNameOf(c.author?.email, c.author?.member?.displayName),
    }));
  }

  @Post('posts/:id/comments')
  async comment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { sub: string; email: string; roles: string[] },
  ) {
    await assertAccountUsable(this.prisma, user.sub);
    if (!(await isVerifiedMember(this.prisma, user.sub, user.roles))) throw new ForbiddenException('Verify your identity first.');
    await assertNoRestriction(this.prisma, user.sub, COMMENT_BLOCK_TYPES);
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.status !== 'PUBLISHED') throw new NotFoundException('Post not found');
    if (!dto.body?.trim()) throw new BadRequestException('Write a comment first.');
    const auto = (user.roles ?? []).some((r) => STAFF.includes(r) || r === 'TRUSTED_MEMBER');
    const row = await this.prisma.postComment.create({
      data: {
        postId: id,
        authorId: user.sub,
        authorName: user.email,
        parentId: dto.parentId ?? undefined,
        body: dto.body.trim().slice(0, 2000),
        status: auto ? 'approved' : 'pending',
      },
    });
    const count = await this.prisma.postComment.count({ where: { postId: id, status: 'approved' } });
    await this.prisma.post.update({ where: { id }, data: { commentCount: count } });
    if (post.authorId !== user.sub) {
      await this.prisma.notification.create({
        data: { userId: post.authorId, category: 'Social', title: 'New comment', body: `${displayNameOf(user.email)} commented on your post.` },
      }).catch(() => null);
    }
    return { id: row.id, status: row.status };
  }

  // ---------- repost ----------

  @Post('posts/:id/repost')
  async repost(
    @Param('id') id: string,
    @Body() dto: { body?: string },
    @CurrentUser() user: { sub: string; email: string; roles: string[] },
  ) {
    await assertAccountUsable(this.prisma, user.sub);
    if (!(await isVerifiedMember(this.prisma, user.sub, user.roles))) throw new ForbiddenException('Verify your identity first.');
    await assertNoRestriction(this.prisma, user.sub, POSTING_BLOCK_TYPES);
    const source = await this.prisma.post.findUnique({ where: { id } });
    // Reshares carry the review state: only live posts can be reshared.
    if (!source || source.status !== 'PUBLISHED') throw new BadRequestException('Only published posts can be reshared.');
    const staffAuthor = (user.roles ?? []).some((r) => STAFF.includes(r));
    const row = await this.prisma.post.create({
      data: {
        authorId: user.sub,
        originPostId: source.id,
        body: String(dto?.body ?? '').slice(0, 2000),
        mediaKind: 'text',
        visibility: 'MEMBERS',
        status: staffAuthor ? 'PUBLISHED' : 'UNDER_REVIEW',
      },
      include: this.postInclude(),
    });
    const count = await this.prisma.post.count({ where: { originPostId: source.id } });
    await this.prisma.post.update({ where: { id: source.id }, data: { repostCount: count } });
    return this.mapPost(row as never, user.sub, new Set());
  }

  // ---------- reports ----------

  @Post('reports')
  async report(@Body() dto: CreateReportDto, @CurrentUser() user: { sub: string }) {
    const kind = String(dto.targetKind ?? '').toLowerCase();
    if (!['post', 'comment', 'member', 'message'].includes(kind)) throw new BadRequestException('Invalid report target');
    if (!dto.targetId || !dto.reason?.trim()) throw new BadRequestException('A reason is required.');
    const row = await this.prisma.report.create({
      data: { reporterId: user.sub, targetKind: kind, targetId: dto.targetId, reason: dto.reason.trim().slice(0, 500), details: dto.details?.slice(0, 2000) },
    });
    return { id: row.id, status: 'OPEN' as const };
  }

  // ---------- admin review ----------

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get('admin/posts')
  async adminPosts(@Query('status') status?: string) {
    const rows = await this.prisma.post.findMany({
      where: status && status.toLowerCase() !== 'all' ? { status: status.toUpperCase() as never } : {},
      include: this.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((p) => this.mapPost(p as never, '', new Set()));
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post('admin/posts/:id/review')
  async reviewPost(
    @Param('id') id: string,
    @Body() dto: ReviewPostDto,
    @CurrentUser() admin: { email: string },
  ) {
    const map = { approve: 'APPROVED', publish: 'PUBLISHED', reject: 'REJECTED', 'request-changes': 'CHANGES_REQUESTED' } as const;
    const status = map[dto.decision];
    if (!status) throw new BadRequestException('Invalid decision');
    const row = await this.prisma.post.update({
      where: { id },
      data: { status: status as never, reviewerNote: (dto as { note?: string }).note, decidedBy: admin.email, decidedAt: new Date() },
      include: this.postInclude(),
    });
    await this.prisma.moderationAction.create({
      data: { actor: admin.email, targetKind: 'post', targetId: id, action: dto.decision, note: (dto as { note?: string }).note },
    }).catch(() => null);
    await this.prisma.notification.create({
      data: { userId: row.authorId, category: 'Moderation', title: `Post ${dto.decision}`, body: (dto as { note?: string }).note ?? 'Your post was reviewed.' },
    }).catch(() => null);
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: `social.post.${dto.decision}`, target: id } }).catch(() => null);
    return this.mapPost(row as never, '', new Set());
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get('admin/comments')
  async adminComments(@Query('status') status?: string) {
    const rows = await this.prisma.postComment.findMany({
      where: status && status.toLowerCase() !== 'all' ? { status: status.toLowerCase() } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows;
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post('admin/comments/:id/review')
  async reviewComment(@Param('id') id: string, @Body() dto: ReviewCommentDto) {
    if (!['approve', 'hide'].includes(dto.decision)) throw new BadRequestException('Invalid decision');
    return this.prisma.postComment.update({ where: { id }, data: { status: dto.decision === 'approve' ? 'approved' : 'hidden' } });
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get('admin/reports')
  async adminReports(@Query('status') status?: string) {
    return this.prisma.report.findMany({
      where: status && status.toLowerCase() !== 'all' ? { status: status.toUpperCase() as never } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post('admin/reports/:id/review')
  async reviewReport(
    @Param('id') id: string,
    @Body() dto: ReviewReportDto,
    @CurrentUser() admin: { email: string },
  ) {
    if (!['resolve', 'dismiss'].includes(dto.decision)) throw new BadRequestException('Invalid decision');
    const report = await this.prisma.report.update({
      where: { id },
      data: { status: dto.decision === 'resolve' ? 'RESOLVED' : 'DISMISSED', decidedBy: admin.email, decidedAt: new Date() },
    });
    if (dto.decision === 'resolve' && dto.postAction === 'hide' && report.targetKind === 'post') {
      await this.prisma.post.update({ where: { id: report.targetId }, data: { status: 'ARCHIVED' } }).catch(() => null);
    }
    if (report.reporterId) {
      await this.prisma.notification.create({
        data: { userId: report.reporterId, category: 'Moderation', title: 'Report reviewed', body: `Your report was ${dto.decision}d. Thank you.` },
      }).catch(() => null);
    }
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: `social.report.${dto.decision}`, target: id } }).catch(() => null);
    return report;
  }
}
