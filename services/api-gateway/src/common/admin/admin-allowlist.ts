/** Must match `services/app/src/common/admin/admin-allowlist.ts`. */
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

export function isPredefinedAdminEmail(email: string): boolean {
  const n = email?.trim().toLowerCase() ?? '';
  if (!n) return false;
  return getPredefinedAdminEmails().includes(n);
}
