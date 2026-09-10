import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OtpCleanupProcessor } from './otp-cleanup.processor';
import { TravelExpiryProcessor } from './travel-expiry.processor';
import { NotifyProcessor } from './notify.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'otp' }, { name: 'travel' }, { name: 'notify' }, { name: 'maintenance' }),
  ],
  providers: [OtpCleanupProcessor, TravelExpiryProcessor, NotifyProcessor],
  exports: [],
})
export class QueuesModule {}
