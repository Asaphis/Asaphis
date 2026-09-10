import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';

@ApiTags('me')
@Controller('me')
export class MeController {
  constructor(private auth: AuthService) {}
  @Get()
  me(@CurrentUser() user: { sub: string }) {
    return this.auth.me(user.sub);
  }
}
