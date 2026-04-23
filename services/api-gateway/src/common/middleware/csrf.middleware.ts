import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import configuration from '../config/configuration';

const CSRF_COOKIE_NAME = 'csrfToken';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const enabled = configuration().ENABLE_CSRF === 'true';
    if (!enabled) {
      next();
      return;
    }

    const currentToken = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
    if (!currentToken) {
      const token = randomBytes(32).toString('hex');
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: configuration().NODE_ENV === 'production',
        sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });
    }

    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
    const headerToken = req.headers['x-csrf-token'] as string | undefined;
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    next();
  }
}
