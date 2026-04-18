import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isPredefinedAdminEmail } from '../admin/admin-allowlist';

/**
 * Allows only allowlisted platform admins: JWT role `ADMIN` and email in
 * {@link getPredefinedAdminEmails} / {@link isPredefinedAdminEmail}.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: string; email?: string };
    }>();
    const user = request.user;
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    const email = String(user?.email ?? '');
    if (!isPredefinedAdminEmail(email)) {
      throw new ForbiddenException(
        'Administrator access is restricted to predefined accounts',
      );
    }
    return true;
  }
}
