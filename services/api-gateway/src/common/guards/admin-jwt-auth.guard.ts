/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import { extractAccessTokenFromRequest } from '../utils/extract-access-token';

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(@Inject('NATS_SERVICE') private readonly client: ClientProxy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const token = extractAccessTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const adminResponse = await firstValueFrom(
        this.client.send('admin.auth.current-user', token),
      );

      if (!adminResponse?.user) {
        throw new UnauthorizedException('Invalid or expired access token');
      }

      request.user = adminResponse.user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
