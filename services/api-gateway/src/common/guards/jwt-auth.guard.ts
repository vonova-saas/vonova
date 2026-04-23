/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGatewayService } from '../../app/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { extractAccessTokenFromRequest } from '../utils/extract-access-token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly authService: AuthGatewayService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = extractAccessTokenFromRequest(request);

    if (!token) {
      this.logger.warn('Access token is required');
      throw new UnauthorizedException('Access token is required');
    }

    try {
      // Use your existing auth service to validate the token
      const userResponse = await firstValueFrom(
        this.authService.currentUser(token).pipe(
          catchError((error) => {
            this.logger.error('Token validation failed:', error.message);
            throw new UnauthorizedException('Invalid or expired access token');
          }),
        ),
      );

      // Check if the response contains user data
      if (!userResponse?.user) {
        this.logger.warn('No user data in auth response');
        throw new UnauthorizedException('Invalid or expired access token');
      }

      // Attach user payload to request for use in controllers
      request.user = userResponse.user;

      const u = userResponse.user as { mustChangePassword?: boolean };
      if (
        u?.mustChangePassword === true &&
        !this.isMustChangePasswordExemptRequest(request)
      ) {
        throw new ForbiddenException(
          'PASSWORD_CHANGE_REQUIRED: Change your password using POST /api/v1/auth/admin/reset-password before continuing.',
        );
      }

      this.logger.log(`User authenticated: ${request.user.email}`);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Authentication error:', error.message);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /** Lets admins complete mandatory password change while holding a valid JWT. */
  private isMustChangePasswordExemptRequest(request: {
    method?: string;
    originalUrl?: string;
    url?: string;
  }): boolean {
    const method = (request.method ?? '').toUpperCase();
    const path = request.originalUrl ?? request.url ?? '';
    return (
      method === 'POST' && path.includes('/api/v1/auth/admin/reset-password')
    );
  }
}
