import { Module } from '@nestjs/common';
import { TravelController } from './travel.controller';

@Module({ controllers: [TravelController] })
export class TravelModule {}
