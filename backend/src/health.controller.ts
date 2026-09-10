import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get('/')
  root() {
    return { name: 'AsaPhis API', version: '1.0', docs: '/docs' };
  }

  @Public()
  @Get('/health')
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }

  @Public()
  @Get('/ready')
  ready() {
    return { ready: true };
  }
}
