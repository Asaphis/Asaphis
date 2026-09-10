import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';

@Processor('otp')
export class OtpCleanupProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) { super(); }
  async process(job: Job): Promise<unknown> {
    void job;
    const res = await this.prisma.phoneVerification.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86400_000) }, consumedAt: { not: null } } });
    return { deleted: res.count };
  }
}
