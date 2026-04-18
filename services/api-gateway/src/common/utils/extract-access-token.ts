import type { Request } from 'express';

/**
 * Reads JWT access token: prefers httpOnly `accessToken` cookie (browser),
 * then `Authorization: Bearer <token>` (Swagger, Postman, mobile).
 */
export function extractAccessTokenFromRequest(
  req: Pick<Request, 'cookies' | 'headers'>,
): string | undefined {
  const fromCookie = req.cookies?.accessToken as string | undefined;
  if (fromCookie) return fromCookie;

  const auth = req.headers?.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    return token || undefined;
  }
  return undefined;
}
