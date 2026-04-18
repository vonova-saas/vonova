/** Maps API/query roles to values stored on User.role in MongoDB. */
export function mapQueryRoleToDbRole(
  role?: string,
): 'STUDENT_USER' | 'INSTRUCTOR_USER' | 'ADMIN' | undefined {
  if (!role) return undefined;
  const u = role.toUpperCase();
  if (u === 'STUDENT' || u === 'STUDENT_USER') return 'STUDENT_USER';
  if (u === 'INSTRUCTOR' || u === 'INSTRUCTOR_USER') return 'INSTRUCTOR_USER';
  if (u === 'ADMIN') return 'ADMIN';
  return undefined;
}

/** DB role for permission checks (User.role in admin DB). */
export const DB_ADMIN_ROLE = 'ADMIN' as const;
