export enum Role {
  PENDING = 'PENDING',
  STUDENT_USER = 'STUDENT_USER',
  INSTRUCTOR_USER = 'INSTRUCTOR_USER',
  /** Platform administrators; only allowlisted vonova.tech emails may have this role. */
  ADMIN = 'ADMIN',
}
