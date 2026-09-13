import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { assertAccountUsable, isVerifiedMember } from '../social/social-access';

class CreateGroupDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isOpen?: boolean;
}

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: { sub: string }) {
    const rows = await this.prisma.group.findMany({
      include: { _count: { select: { members: { where: { status: 'active' } }, posts: true } }, members: { where: { userId: user.sub }, select: { status: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      isOpen: g.isOpen,
      memberCount: g._count.members,
      postCount: g._count.posts,
      myStatus: g.members[0]?.status ?? null,
      myRole: g.members[0]?.role ?? null,
      createdAt: g.createdAt,
    }));
  }

  @Roles('CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post()
  async create(@Body() dto: CreateGroupDto, @CurrentUser() admin: { email: string }) {
    if (!dto.name?.trim()) throw new BadRequestException('A group name is required.');
    const group = await this.prisma.group.create({
      data: { name: dto.name.trim().slice(0, 120), description: String(dto.description ?? '').slice(0, 2000), isOpen: dto.isOpen ?? false, createdBy: admin.email },
    });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'group.create', target: group.id } }).catch(() => null);
    return group;
  }

  @Post(':id/join')
  async join(@Param('id') id: string, @CurrentUser() user: { sub: string; roles: string[] }) {
    await assertAccountUsable(this.prisma, user.sub);
    if (!(await isVerifiedMember(this.prisma, user.sub, user.roles))) {
      throw new ForbiddenException('Verify your identity to join groups.');
    }
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    const existing = await this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId: user.sub } } });
    if (existing) {
      if (existing.status === 'banned') throw new ForbiddenException('Not allowed');
      return existing;
    }
    return this.prisma.groupMember.create({
      data: { groupId: id, userId: user.sub, role: 'member', status: group.isOpen ? 'active' : 'pending' },
    });
  }

  @Delete(':id/leave')
  async leave(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    await this.prisma.groupMember.deleteMany({ where: { groupId: id, userId: user.sub } });
    return { ok: true };
  }

  @Get(':id/members')
  async members(@Param('id') id: string, @CurrentUser() user: { sub: string; roles: string[] }) {
    const mine = await this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: id, userId: user.sub } } });
    const staff = (user.roles ?? []).some((r) => ['MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(r));
    if ((!mine || mine.status !== 'active') && !staff) throw new ForbiddenException('Join the group first.');
    const rows = await this.prisma.groupMember.findMany({
      where: { groupId: id },
      include: { user: { select: { id: true, email: true, member: { select: { displayName: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((m) => ({
      userId: m.userId,
      displayName: m.user.member?.displayName ?? m.user.email.split('@')[0],
      role: m.role,
      status: m.status,
      createdAt: m.createdAt,
    }));
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post(':id/members/:userId/approve')
  async approve(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() admin: { email: string }) {
    const row = await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId: id, userId } },
      data: { status: 'active' },
    });
    await this.prisma.notification.create({
      data: { userId, category: 'Social', title: 'Group request approved', body: 'You can now post in the group.' },
    }).catch(() => null);
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'group.member.approve', target: `${id}:${userId}` } }).catch(() => null);
    return row;
  }

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SUPER_ADMIN')
  @Post(':id/members/:userId/ban')
  async ban(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() admin: { email: string }) {
    const row = await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId: id, userId } },
      data: { status: 'banned' },
    });
    await this.prisma.adminAuditLog.create({ data: { adminEmail: admin.email, action: 'group.member.ban', target: `${id}:${userId}` } }).catch(() => null);
    return row;
  }
}
