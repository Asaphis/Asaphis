import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('admin')
@Controller('admin')
@Roles('MODERATOR', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SECURITY_ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('dashboard')
  async dashboard() {
    const [totalMembers, activeMembers, verifiedMembers, pendingIdentity, pendingSubmissions, pendingTravel, restricted, contributions, suspiciousSessions] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { activatedAt: { not: null } } }),
      this.prisma.identityProfile.count({ where: { status: 'VERIFIED' } }),
      this.prisma.identityProfile.count({ where: { status: { in: ['SUBMITTED', 'PROCESSING', 'NEEDS_REVIEW'] } } }),
      this.prisma.contentSubmission.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      this.prisma.travelRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.restriction.count({ where: { active: true } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCESSFUL' }, _sum: { amount: true }, _count: true }),
      this.prisma.session.count({ where: { revokedAt: null, device: { riskLevel: { in: ['HIGH', 'CRITICAL'] } } } }),
    ]);
    const recentActivity = await this.prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    return {
      totalMembers,
      activeMembers,
      verifiedMembers,
      pendingIdentity,
      pendingSubmissions,
      pendingTravel,
      restrictedAccounts: restricted,
      contributionsTotal: String(contributions._sum.amount ?? 0),
      contributionsCount: contributions._count,
      suspiciousSessions,
      recentActivity,
    };
  }

  @Get('members')
  members(@Query('search') search?: string) {
    return this.prisma.user.findMany({
      where: search ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { member: { displayName: { contains: search, mode: 'insensitive' } } }] } : {},
      include: { member: true, identityProfile: true, travelRequests: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Get('members/:id')
  member(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { member: true, identityProfile: { include: { verifications: { orderBy: { createdAt: 'desc' }, take: 10 } } }, devices: true, sessions: { orderBy: { lastActiveAt: 'desc' }, take: 10 }, restrictions: { orderBy: { appliedAt: 'desc' } }, travelRequests: { orderBy: { createdAt: 'desc' } } },
    });
  }

  @Post('members/:id/roles')
  async setRoles(@Param('id') id: string, @Body() body: { roles: string[] }, @CurrentUser() admin: { email: string }) {
    const before = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const row = await this.prisma.user.update({ where: { id }, data: { roles: body.roles as never } });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'admin.roles.update', target: id, previousState: { roles: before.roles } as never, newState: { roles: row.roles } as never } });
    return row;
  }

  @Roles('SUPER_ADMIN')
  @Get('admins')
  admins() {
    return this.prisma.user.findMany({
      where: { roles: { hasSome: ['MODERATOR', 'CONTENT_ADMIN', 'FINANCE_ADMIN', 'SECURITY_ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true, email: true, roles: true, lastLoginAt: true, createdAt: true, member: { select: { displayName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get('providers')
  providers() {
    return this.prisma.verificationProvider.findMany({ orderBy: { priority: 'asc' } });
  }

  @Post('providers/:id/toggle')
  toggle(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.prisma.verificationProvider.update({ where: { id }, data: { enabled: body.enabled } });
  }

  // Honest connectivity check: reports whether a secret is configured and
  // stamps the test time. Never returns secret material.
  @Post('providers/:id/test')
  async test(@Param('id') id: string, @CurrentUser() admin: { email: string }) {
    const provider = await this.prisma.verificationProvider.findUniqueOrThrow({ where: { id } });
    const ok = provider.secretConfigured && provider.enabled;
    const row = await this.prisma.verificationProvider.update({
      where: { id },
      data: { lastTestedAt: new Date(), lastTestResult: ok ? 'ok' : 'failed' },
    });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'provider.test', target: id, newState: { result: ok ? 'ok' : 'failed' } as never } });
    return row;
  }
}
