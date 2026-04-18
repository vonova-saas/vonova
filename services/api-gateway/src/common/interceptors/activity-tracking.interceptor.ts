import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { AdminGatewayService } from '../../admin/admin.service';

/**
 * After JWT auth, records lastSeenAt + lastAction in the admin service (UserActivity).
 * Runs the touch in parallel with the route handler to avoid added latency.
 */
@Injectable()
export class ActivityTrackingInterceptor implements NestInterceptor {
  constructor(private readonly adminGatewayService: AdminGatewayService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      user?: { _id?: string };
      method?: string;
      route?: { path?: string };
      path?: string;
    }>();

    const userId = req.user?._id;
    if (!userId) {
      return next.handle();
    }

    const method = req.method ?? 'UNKNOWN';
    const routePath = req.route?.path ?? req.path ?? '';
    const lastAction = `${method} ${routePath}`.slice(0, 500);

    void firstValueFrom(
      this.adminGatewayService.touchActivity(String(userId), lastAction),
    ).catch(() => undefined);

    return next.handle();
  }
}
