import { Controller, Get, Param, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const ALLOWED = new Map<string, string[]>([
  ['community', ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']],
  ['identity', ['image/jpeg', 'image/png', 'application/pdf']],
  ['content', ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']],
  ['document', ['application/pdf', 'image/jpeg', 'image/png']],
]);

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private prisma: PrismaService) {}

  @Post('upload/:kind')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  async upload(@Param('kind') kind: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: { sub: string }) {
    const allowed = ALLOWED.get(kind) ?? ALLOWED.get('community')!;
    if (!file) throw new BadRequestException('No file');
    if (!allowed.includes(file.mimetype)) throw new BadRequestException(`MIME ${file.mimetype} not allowed for ${kind}`);
    const maxMb = kind === 'identity' ? Number(process.env.IDENTITY_DOC_MAX_MB ?? 10) : Number(process.env.FILE_MAX_MB ?? 25);
    if (file.size > maxMb * 1024 * 1024) throw new BadRequestException(`File exceeds ${maxMb}MB`);
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    // Malware scan hook: MALWARE_SCAN_ENABLED -> POST to MALWARE_SCAN_ENDPOINT, else mark skipped.
    const scanStatus = (process.env.MALWARE_SCAN_ENABLED ?? 'false') === 'true' ? 'pending' : 'skipped';
    const row = await this.prisma.fileAsset.create({
      data: {
        ownerId: user.sub,
        kind,
        bucket: process.env.S3_BUCKET ?? 'asaphis-media',
        objectKey: `${kind}/${user.sub}/${Date.now()}-${file.originalname}`,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        checksum,
        scanStatus,
        private: kind === 'identity',
      },
    });
    // NOTE: S3 putObject happens in worker/infra; V1 returns token for client to complete direct upload.
    return { fileId: row.id, fileToken: row.id, objectKey: row.objectKey, scanStatus };
  }

  @Get(':id/url')
  async url(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    const row = await this.prisma.fileAsset.findFirst({ where: { id } });
    if (!row) throw new BadRequestException('Unknown file');
    // Private identity docs stay owner/admin-only; public content is open.
    if (row.private && row.ownerId !== user.sub) throw new BadRequestException('Not authorized');
    const base = (process.env.S3_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');
    const url = base ? `${base}/${row.objectKey}` : `/api/v1/files/${row.id}/download?token=${row.id}`;
    return { url, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(), private: row.private };
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    const row = await this.prisma.fileAsset.findFirst({ where: { id } });
    if (!row) throw new BadRequestException('Unknown file');
    if (row.private && row.ownerId !== user.sub) throw new BadRequestException('Not authorized');
    // Production: stream from S3 with presigned URL (S3_* env). V1 returns
    // metadata + objectKey so infra/worker can serve it.
    return { fileId: row.id, objectKey: row.objectKey, mimeType: row.mimeType, sizeBytes: row.sizeBytes, private: row.private };
  }
}
