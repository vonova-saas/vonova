import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Attaches a stable correlation ID to every request. If the client already
 * sent `X-Request-ID` we keep it (so distributed traces stay linked),
 * otherwise we generate a v4 UUID. The id is mirrored back on the response
 * for client-side log correlation.
 */
export function requestIdMiddleware(
  req: Request & { id?: string },
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header('x-request-id')?.trim();
  const id =
    incoming && /^[A-Za-z0-9._:-]{1,128}$/.test(incoming)
      ? incoming
      : randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}
