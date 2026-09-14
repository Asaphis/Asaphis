import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class UpsertContentDto {
  @IsString() section!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() kind?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsArray() mediaUrls?: string[];
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() posterUrl?: string;
  @IsOptional() @IsString() visibility?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() sortOrder?: number;
}

class UpdateContentDto {
  @IsOptional() @IsString() section?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() kind?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsArray() mediaUrls?: string[];
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() posterUrl?: string;
  @IsOptional() @IsString() visibility?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() sortOrder?: number;
}

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private prisma: PrismaService) {}

  // Public landing — matches user frontend getPublishedLandingContent shape (aggregated)
  @Public()
  @Get('published')
  async published() {
    const items = await this.prisma.contentItem.findMany({ where: { status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' } });
    const sections = await this.prisma.landingSection.findMany({ where: { visible: true }, orderBy: { sortOrder: 'asc' } });
    return { items, sections };
  }

  @Public()
  @Get('education')
  async education(@Query('category') category?: string, @Query('search') search?: string) {
    return this.prisma.contentItem.findMany({
      where: {
        status: 'PUBLISHED',
        section: { equals: 'education', mode: 'insensitive' },
        ...(category && category !== 'All' ? { title: { contains: category, mode: 'insensitive' } } : {}),
        ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { body: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      orderBy: { sortOrder: 'asc' },
      take: 100,
    });
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get('admin')
  adminList() {
    return this.prisma.contentItem.findMany({ orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }], take: 200 });
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post()
  async create(@Body() dto: UpsertContentDto, @CurrentUser() admin: { email: string }) {
    // mediaUrls is the source of truth; imageUrl/videoUrl/posterUrl are
    // convenience fields from admin UI merged in order [image, video].
    const media: string[] = Array.isArray(dto.mediaUrls) ? [...dto.mediaUrls] : [];
    if (dto.imageUrl && !media.includes(dto.imageUrl)) media.unshift(dto.imageUrl);
    if (dto.videoUrl && !media.includes(dto.videoUrl)) media.push(dto.videoUrl);
    if (dto.posterUrl && !media.includes(dto.posterUrl)) media.unshift(dto.posterUrl);
    const row = await this.prisma.contentItem.create({
      data: { section: dto.section, kind: dto.kind ?? 'Article', title: dto.title, body: dto.body ?? '', mediaUrls: media, visibility: (dto.visibility?.toUpperCase() as never) ?? 'PUBLIC', status: (dto.status?.toUpperCase() as never) ?? 'DRAFT', sortOrder: dto.sortOrder ?? 0, updatedBy: admin.email },
    });
    await this.prisma.contentVersion.create({ data: { contentId: row.id, version: 1, snapshot: row as never, summary: 'Created', changedBy: admin.email } });
    return row;
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateContentDto, @CurrentUser() admin: { email: string }) {
    const prev = await this.prisma.contentItem.findUniqueOrThrow({ where: { id } });
    const media: string[] | undefined = dto.mediaUrls
      ? [...dto.mediaUrls]
      : dto.imageUrl || dto.videoUrl || dto.posterUrl
        ? [...(prev.mediaUrls ?? [])]
        : undefined;
    if (media && dto.imageUrl && !media.includes(dto.imageUrl)) media.unshift(dto.imageUrl);
    if (media && dto.videoUrl && !media.includes(dto.videoUrl)) media.push(dto.videoUrl);
    if (media && dto.posterUrl && !media.includes(dto.posterUrl)) media.unshift(dto.posterUrl);
    const row = await this.prisma.contentItem.update({
      where: { id },
      data: {
        ...(dto.section !== undefined ? { section: dto.section } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(media !== undefined ? { mediaUrls: media } : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility.toUpperCase() as never } : {}),
        ...(dto.status !== undefined ? { status: dto.status.toUpperCase() as never } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        updatedBy: admin.email,
        ...(dto.status?.toUpperCase() === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
      },
    });
    const count = await this.prisma.contentVersion.count({ where: { contentId: id } });
    await this.prisma.contentVersion.create({ data: { contentId: id, version: count + 1, snapshot: row as never, summary: 'Edited content fields', changedBy: admin.email } });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'content.update', target: id, previousState: { title: prev.title } as never, newState: { title: row.title } as never } });
    return row;
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Patch(':id/status')
  async setStatus(@Param('id') id: string, @Body() body: { status: string }, @CurrentUser() admin: { email: string }) {
    const row = await this.prisma.contentItem.update({ where: { id }, data: { status: body.status as never, updatedBy: admin.email, publishedAt: body.status === 'PUBLISHED' ? new Date() : undefined } });
    const count = await this.prisma.contentVersion.count({ where: { contentId: id } });
    await this.prisma.contentVersion.create({ data: { contentId: id, version: count + 1, snapshot: row as never, summary: `Status -> ${body.status}`, changedBy: admin.email } });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'content.status', target: id, newState: { status: body.status } as never } });
    return row;
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post(':id/restore/:version')
  async restore(@Param('id') id: string, @Param('version') version: string, @CurrentUser() admin: { email: string }) {
    const v = await this.prisma.contentVersion.findUniqueOrThrow({ where: { contentId_version: { contentId: id, version: Number(version) } } });
    const snap = v.snapshot as Record<string, never>;
    return this.prisma.contentItem.update({ where: { id }, data: { title: snap['title'], body: snap['body'], status: snap['status'], visibility: snap['visibility'], updatedBy: admin.email } });
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get(':id/versions')
  versions(@Param('id') id: string) {
    return this.prisma.contentVersion.findMany({ where: { contentId: id }, orderBy: { version: 'desc' } });
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() admin: { email: string }) {
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'content.delete', target: id } });
    await this.prisma.contentVersion.deleteMany({ where: { contentId: id } });
    await this.prisma.contentItem.delete({ where: { id } });
    return { ok: true };
  }
}
