/**
 * Only these emails may hold role `ADMIN` in the database.
 * Keep in sync with the admin seeder service and `services/api-gateway` allowlist.
 *
 * Read env lazily: this module is imported before `ConfigModule` loads `.env`, so
 * any snapshot at import time can be empty even when `.env` is correct.
 */
function readAdminEmailSlot(
  key: 'ADMIN_EMAIL_1' | 'ADMIN_EMAIL_2' | 'ADMIN_EMAIL_3',
): string | undefined {
  const v = process.env[key];
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t.toLowerCase() : undefined;
}

export function getPredefinedAdminEmails(): readonly string[] {
  return [
    readAdminEmailSlot('ADMIN_EMAIL_1'),
    readAdminEmailSlot('ADMIN_EMAIL_2'),
    readAdminEmailSlot('ADMIN_EMAIL_3'),
  ].filter((e): e is string => e !== undefined);
}

export type PredefinedAdminEmail = ReturnType<
  typeof getPredefinedAdminEmails
>[number];

export function normalizeAdminEmail(email: string | undefined | null): string {
  if (email == null || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function isPredefinedAdminEmail(email: string): boolean {
  const n = normalizeAdminEmail(email);
  if (!n) return false;
  return getPredefinedAdminEmails().includes(n);
}
