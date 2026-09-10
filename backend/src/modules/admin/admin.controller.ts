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
    const [totalMembers, verifiedMembers, pendingIdentity, pendingSubmissions, pendingTravel, restricted] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.identityProfile.count({ where: { status: 'VERIFIED' } }),
      this.prisma.identityProfile.count({ where: { status: { in: ['SUBMITTED', 'PROCESSING', 'NEEDS_REVIEW'] } } }),
      this.prisma.contentSubmission.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      this.prisma.travelRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.restriction.count({ where: { active: true } }),
    ]);
    const recentActivity = await this.prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    return { totalMembers, verifiedMembers, pendingIdentity, pendingSubmissions, pendingTravel, restrictedAccounts: restricted, recentActivity };
  }

  @Get('members')
  members(@Query('search') search?: string) {
    return this.prisma.user.findMany({
      where: search ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { member: { displayName: { contains: search, mode: 'insensitive' } } }] } : {},
      include: { member: true, identityProfile: true },
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

  @Get('providers')
  providers() {
    return this.prisma.verificationProvider.findMany({ orderBy: { priority: 'asc' } });
  }

  @Post('providers/:id/toggle')
  toggle(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.prisma.verificationProvider.update({ where: { id }, data: { enabled: body.enabled } });
  }
}
