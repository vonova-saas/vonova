/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guard to prevent admins from accessing normal user endpoints.
 * Admins must use dedicated admin endpoints (/api/v1/admin/auth/*).
 */
@Injectable()
export class PreventAdminAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: string } | undefined;

    // If user has admin role, block access to user endpoints
    if (user?.role === 'admin') {
      throw new ForbiddenException(
        'Admins must use admin auth endpoints. Please use /api/v1/admin/auth/* endpoints.',
      );
    }

    return true;
  }
}
