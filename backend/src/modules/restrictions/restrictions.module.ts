import { Module } from '@nestjs/common';
import { RestrictionsController } from './restrictions.controller';

@Module({ controllers: [RestrictionsController] })
export class RestrictionsModule {}
