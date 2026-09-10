import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;
    const req = ctx.switchToHttp().getRequest();
    const roles: string[] = req.user?.roles ?? [];
    // SUPER_ADMIN bypasses all role checks; TRUSTED_MEMBER inherits MEMBER
    if (roles.includes('SUPER_ADMIN')) return true;
    const expanded = new Set(roles);
    if (expanded.has('TRUSTED_MEMBER')) expanded.add('MEMBER');
    const ok = required.some((r) => expanded.has(r));
    if (!ok) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
