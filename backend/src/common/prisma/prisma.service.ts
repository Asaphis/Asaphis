import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch {
      // Allow boot without DB for docs/build; requests will surface errors.
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
