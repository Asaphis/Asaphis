import { Module } from '@nestjs/common';
import { PhoneController } from './phone.controller';

@Module({ controllers: [PhoneController] })
export class PhoneModule {}
