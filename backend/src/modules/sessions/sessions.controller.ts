import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('sessions')
@Controller('me/sessions')
export class SessionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }) {
    return this.prisma.session.findMany({ where: { userId: user.sub, revokedAt: null }, orderBy: { lastActiveAt: 'desc' } });
  }

  @Delete(':id')
  async terminate(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    await this.prisma.session.updateMany({ where: { id, userId: user.sub }, data: { revokedAt: new Date() } });
    return { terminated: true };
  }
}
