import type { Request } from 'express';
import { extractAccessTokenFromRequest } from './extract-access-token';

type ReqLike = Pick<Request, 'cookies' | 'headers'> & { user?: unknown };

/**
 * JWT access token payload (app service signs `{ userId, role, ... }`).
 * Used only after JwtAuthGuard has validated the token — no crypto verify here.
 */
function decodeJwtPayloadUnsafe(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const seg = parts[1];
    const json = Buffer.from(
      seg.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeCandidate(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string') {
    const s = raw.trim();
    return s.length > 0 ? s : undefined;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw);
  }
  if (typeof raw === 'object' && raw !== null && '$oid' in raw) {
    const oid = (raw as { $oid?: unknown }).$oid;
    if (oid != null && String(oid).trim()) return String(oid).trim();
  }
  if (
    typeof raw === 'object' &&
    raw !== null &&
    typeof (raw as { toString?: () => string }).toString === 'function'
  ) {
    const s = (raw as { toString: () => string }).toString().trim();
    if (s && s !== '[object Object]') return s;
  }
  return undefined;
}

function pickFromUserObject(u: unknown): string | undefined {
  if (!u || typeof u !== 'object') return undefined;
  const o = u as Record<string, unknown>;
  const candidates: unknown[] = [
    o['_id'],
    o['id'],
    o['sub'],
    o['userId'],
    o['user_id'],
  ];
  for (const raw of candidates) {
    const s = normalizeCandidate(raw);
    if (s) return s;
  }
  return undefined;
}

function pickFromJwtPayload(p: Record<string, unknown>): string | undefined {
  for (const k of ['userId', 'sub', 'id', '_id', 'user_id'] as const) {
    const s = normalizeCandidate(p[k]);
    if (s) return s;
  }
  return undefined;
}

/**
 * Resolve the authenticated app user id for LMS ownership / access checks.
 * 1) `req.user` from auth RPC (Mongo user document)
 * 2) JWT payload `userId` / `sub` (same token JwtAuthGuard already validated)
 */
export function resolveRequesterUserId(req: ReqLike): string | undefined {
  const fromUser = pickFromUserObject(req.user);
  if (fromUser) return fromUser;

  const token = extractAccessTokenFromRequest(req);
  if (!token) return undefined;

  const payload = decodeJwtPayloadUnsafe(token);
  if (!payload) return undefined;

  return pickFromJwtPayload(payload);
}
