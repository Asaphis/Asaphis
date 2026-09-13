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
    const [totalMembers, activeMembers, verified, contributions, submissions, community, byCountry, joinedDates] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { activatedAt: { not: null } } }),
      this.prisma.identityProfile.count({ where: { status: 'VERIFIED' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCESSFUL' }, _sum: { amount: true }, _count: true }),
      this.prisma.contentSubmission.groupBy({ by: ['status'], _count: true }),
      this.prisma.contentSubmission.count(),
      this.prisma.member.groupBy({ by: ['citizenshipCountry'], _count: true }),
      this.prisma.member.findMany({ select: { joinedAt: true } }),
    ]);
    const buckets = new Map<string, number>();
    for (const row of joinedDates) {
      const key = row.joinedAt.toISOString().slice(0, 7);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const memberGrowth = [...buckets.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-12)
      .map(([label, value]) => ({ label, value }));
    const moderation = { approved: 0, rejected: 0, pending: 0 };
    for (const row of submissions) {
      if (row.status === 'APPROVED' || row.status === 'PUBLISHED') moderation.approved += row._count;
      else if (row.status === 'REJECTED') moderation.rejected += row._count;
      else moderation.pending += row._count;
    }
    return {
      totalMembers,
      activeMembers,
      verifiedMembers: verified,
      verificationRate: totalMembers > 0 ? Math.round((verified / totalMembers) * 1000) / 10 : 0,
      contributions: { total: String(contributions._sum.amount ?? 0), count: contributions._count },
      submissions,
      moderation,
      communitySubmissions: community,
      countryDistribution: byCountry.map((row) => ({ label: row.citizenshipCountry ?? 'Unknown', value: row._count })),
      memberGrowth,
    };
  }

  @Post('events')
  async track(@Body() body: { name: string; userId?: string; props?: Record<string, unknown> }) {
    // Product analytics separate from security telemetry.
    await this.prisma.analyticsEvent.create({ data: { name: body.name, userId: body.userId, props: (body.props ?? {}) as never } });
    return { ok: true };
  }
}
