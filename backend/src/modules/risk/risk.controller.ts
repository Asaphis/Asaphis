import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('risk')
@Controller('risk')
export class RiskController {
  constructor(private prisma: PrismaService) {}
  @Get('mine')
  mine(@CurrentUser() user: { sub: string }) {
    return this.prisma.riskScore.findMany({ where: { userId: user.sub }, orderBy: { createdAt: 'desc' }, take: 20 });
  }
}
