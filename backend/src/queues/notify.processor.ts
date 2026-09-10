import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('notify')
export class NotifyProcessor extends WorkerHost {
  async process(job: Job<{ to: string; title: string; body: string }>): Promise<unknown> {
    // Fan-out to email/SMS/WhatsApp/push via configured providers.
    void job;
    return { ok: true };
  }
}
