import type { Request } from 'express';

/**
 * Reads JWT access token: prefers `Authorization: Bearer <token>`
 * (Swagger, Postman, SPA with local token), then falls back to
 * httpOnly `accessToken` cookie (browser session).
 */
export function extractAccessTokenFromRequest(
  req: Pick<Request, 'cookies' | 'headers'>,
): string | undefined {
  const auth = req.headers?.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    return token || undefined;
  }

  const fromCookie = req.cookies?.accessToken as string | undefined;
  if (fromCookie) return fromCookie;

  return undefined;
}
