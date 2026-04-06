import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

type JsonValue = unknown[] | Record<string, unknown> | unknown;

function sanitize(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      out[key.replace(/[<>]/g, '')] = sanitize(val);
    }
    return out;
  }
  if (typeof value === 'string') return value.replace(/[<>]/g, '');
  return value;
}

@Injectable()
export class RequestSanitizerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitize(req.body);
    }
    next();
  }
}
