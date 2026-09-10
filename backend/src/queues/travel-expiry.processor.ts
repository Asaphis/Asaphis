import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';

@Processor('travel')
export class TravelExpiryProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) { super(); }
  async process(job: Job): Promise<unknown> {
    void job;
    const expired = await this.prisma.travelRequest.updateMany({
      where: { status: 'APPROVED', endDate: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
    return { expired: expired.count };
  }
}
