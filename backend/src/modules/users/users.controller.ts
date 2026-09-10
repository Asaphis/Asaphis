import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Roles('MODERATOR', 'CONTENT_ADMIN', 'SECURITY_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN')
  @Get()
  async list(@Query('search') search?: string, @Query('take') take = '20') {
    const where = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { member: { displayName: { contains: search, mode: 'insensitive' as const } } }] }
      : {};
    const users = await this.prisma.user.findMany({ where, take: Math.min(Number(take) || 20, 100), include: { member: true }, orderBy: { createdAt: 'desc' } });
    return users.map((u) => ({ id: u.id, email: u.email, roles: u.roles, accountStatus: u.accountStatus, stage: u.membershipStage, member: u.member }));
  }
}
