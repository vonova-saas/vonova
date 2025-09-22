export const Permissions = {
  // Quiz Management (must match App service strings exactly)
  CREATE_QUIZ: "CREATE_QUIZ",
  VIEW_QUIZ: "VIEW_QUIZ",
  EDIT_QUIZ: "EDIT_QUIZ",
  GRADE_QUIZ: "GRADE_QUIZ",
  DELETE_QUIZ: "DELETE_QUIZ",
  SUBMIT_QUIZ: "SUBMIT_QUIZ",
  VIEW_GRADES: "VIEW_GRADES",
  // Assignment Management (must match App service strings exactly)
  CREATE_ASSIGNMENT: "CREATE_ASSIGNMENT",
  VIEW_ASSIGNMENT: "VIEW_ASSIGNMENT",
  EDIT_ASSIGNMENT: "EDIT_ASSIGNMENT",
  GRADE_ASSIGNMENT: "GRADE_ASSIGNMENT",
  DELETE_ASSIGNMENT: "DELETE_ASSIGNMENT",
  SUBMIT_ASSIGNMENT: "SUBMIT_ASSIGNMENT",
  VIEW_ASSIGNMENT_GRADES: "VIEW_ASSIGNMENT_GRADES",
} as const;

export type PermissionType = keyof typeof Permissions;
export type PermissionValue = typeof Permissions[PermissionType];
