import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, { ip: req.ip, userAgent: req.headers['user-agent'] });
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto.email, dto.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      deviceKey: (req.headers['x-device-key'] as string) ?? undefined,
    });
    this.auth.setCookies(res, result.accessToken, result.refreshToken);
    // Shape matches user frontend contract { token, memberId } + extra fields
    return {
      token: result.accessToken,
      memberId: result.memberId,
      userId: result.userId,
      roles: result.roles,
      sessionId: result.sessionId,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string>;
    const rt = cookies?.['asaphis_rt'];
    if (!rt) return { refreshed: false };
    const out = await this.auth.refresh(rt);
    this.auth.setCookies(res, out.accessToken, rt);
    return { token: out.accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser() user: { sub: string }) {
    const cookies = req.cookies as Record<string, string>;
    await this.auth.logout(cookies?.['asaphis_rt'], user?.sub);
    this.auth.clearCookies(res);
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: { sub: string }) {
    return this.auth.me(user.sub);
  }
}
