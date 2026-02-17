/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGatewayService } from '../../app/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly authService: AuthGatewayService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);

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
      this.logger.log(`User authenticated: ${request.user.email}`);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Authentication error:', error.message);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractTokenFromCookie(request: any): string | undefined {
    return request.cookies?.accessToken;
  }
}
