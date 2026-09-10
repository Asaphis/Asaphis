import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthorizationService } from './authorization.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('authorization')
@Controller('authorization')
export class AuthorizationController {
  constructor(private policy: AuthorizationService) {}

  @Post('evaluate')
  evaluate(@Body() body: { action: string; resource?: string }, @CurrentUser() user: { sub: string; roles: string[] }) {
    return this.policy.evaluate({ userId: user.sub, roles: user.roles ?? [], action: body.action, resource: body.resource });
  }
}
