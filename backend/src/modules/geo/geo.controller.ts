import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  @Public()
  @Get('lookup')
  lookup(@Req() req: Request) {
    // Mock IP-intel: country/ASN/VPN signals. Replace with MaxMind/ipinfo via IP_INTEL_PROVIDER.
    // IP geography is a security signal only — never identity proof.
    const ip = req.ip ?? 'unknown';
    return { ip, country: 'NG', region: 'Lagos', asn: 'AS29465', isp: 'Mock ISP', datacenter: false, vpn: false, tor: false, provider: process.env.IP_INTEL_PROVIDER ?? 'mock' };
  }
}
