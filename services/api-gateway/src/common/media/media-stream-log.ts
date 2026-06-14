import type { Request } from 'express';
import { extractAccessTokenFromRequest } from '../utils/extract-access-token';
import { resolveRequesterUserId } from '../utils/request-user-id';

export function logMediaStreamRequest(
  req: Request,
  payload: {
    path: string;
    bucket: string;
    keySample: string;
    contentType: string;
    status: number;
    userId?: string | null;
  },
): void {
  const hasCookie = Boolean(req.cookies?.accessToken);
  const hasAuthHeader = Boolean(
    typeof req.headers.authorization === 'string' &&
      req.headers.authorization.startsWith('Bearer '),
  );
  const userResolved = Boolean(payload.userId ?? resolveRequesterUserId(req));
  const tokenPresent = Boolean(extractAccessTokenFromRequest(req));

  console.log(
    `[MEDIA_STREAM] path=${payload.path} bucket=${payload.bucket} keySample=${payload.keySample} contentType=${payload.contentType} status=${payload.status} range=${typeof req.headers.range === 'string' ? req.headers.range : '-'} userId=${payload.userId ?? '-'}`,
  );
  console.log(
    `[MEDIA_AUTH_CHECK] hasCookie=${hasCookie} hasAuthHeader=${hasAuthHeader} tokenPresent=${tokenPresent} origin=${typeof req.headers.origin === 'string' ? req.headers.origin : '-'} path=${req.path} userResolved=${userResolved}`,
  );
}
