import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private prisma: PrismaService) {}

  @Roles('FINANCE_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Get()
  async summary() {
    const [totalMembers, verified, contributions, submissions] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.identityProfile.count({ where: { status: 'VERIFIED' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCESSFUL' }, _sum: { amount: true }, _count: true }),
      this.prisma.contentSubmission.groupBy({ by: ['status'], _count: true }),
    ]);
    return { totalMembers, verifiedMembers: verified, contributions, submissions };
  }

  @Post('events')
  async track(@Body() body: { name: string; userId?: string; props?: Record<string, unknown> }) {
    // Product analytics separate from security telemetry.
    await this.prisma.analyticsEvent.create({ data: { name: body.name, userId: body.userId, props: (body.props ?? {}) as never } });
    return { ok: true };
  }
}
