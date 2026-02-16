import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Env } from '../../config/env.config';

@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers['x-internal-secret'] || request.headers['authorization']?.replace('Bearer ', '');

    if (!secret || secret !== Env.INTERNAL_API_SECRET_KEY) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    return true;
  }
}

