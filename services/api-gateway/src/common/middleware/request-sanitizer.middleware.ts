import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

type JsonLike = Record<string, unknown> | unknown[] | unknown;

/** Field names whose string values may contain `<` / `>` legitimately (code, math, markup). */
const STRING_FIELDS_PRESERVE_ANGLE_BRACKETS = new Set([
  'code',
  'constraints',
  'description',
  'response',
  'hint',
  'explanation',
  'content',
  'body',
  'message',
  'text',
  'markdown',
]);

function sanitizeString(value: string): string {
  return value.replace(/[<>]/g, '');
}

function sanitizeObject(value: JsonLike, fieldName?: string): JsonLike {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item, fieldName));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [rawKey, rawVal] of Object.entries(value)) {
      if (rawKey.startsWith('$') || rawKey.includes('.')) {
        continue;
      }
      const key = sanitizeString(rawKey);
      result[key] = sanitizeObject(rawVal, rawKey);
    }
    return result;
  }

  if (typeof value === 'string') {
    if (fieldName && STRING_FIELDS_PRESERVE_ANGLE_BRACKETS.has(fieldName)) {
      return value;
    }
    return sanitizeString(value);
  }

  return value;
}

@Injectable()
export class RequestSanitizerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery = sanitizeObject(req.query);
      if (
        sanitizedQuery &&
        typeof sanitizedQuery === 'object' &&
        !Array.isArray(sanitizedQuery)
      ) {
        const queryObject = req.query as Record<string, unknown>;
        for (const key of Object.keys(queryObject)) {
          delete queryObject[key];
        }
        Object.assign(queryObject, sanitizedQuery as Record<string, unknown>);
      }
    }
    next();
  }
}
