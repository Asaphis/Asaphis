import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  list() {
    return this.prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  @Public()
  @Get(':code')
  get(@Param('code') code: string) {
    return this.prisma.country.findUnique({ where: { code: code.toUpperCase() } });
  }

  @Roles('SECURITY_ADMIN', 'SUPER_ADMIN')
  @Patch(':code')
  async update(@Param('code') code: string, @Body() patch: Record<string, unknown>) {
    const allowed = [
      'enabled', 'allowedDocuments', 'verificationProvider', 'govIdCheckEnabled',
      'phoneRequired', 'livenessRequired', 'manualReview', 'eligibilityRule',
      'travelRule', 'accessRule', 'currency', 'contributionAmount',
      'paymentProviders', 'paymentMethods', 'usesGlobalFallback',
    ];
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (k in patch) data[k] = patch[k];
    return this.prisma.country.update({ where: { code: code.toUpperCase() }, data });
  }
}
