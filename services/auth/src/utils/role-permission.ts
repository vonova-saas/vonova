import {
  Permissions,
  PermissionType,
  RoleType,
} from "../enums/role.enum";

export const RolePermissions: Record<RoleType, Array<PermissionType>> = {
  ADMIN: [
    Permissions.ADD_INSTRACTOR,
    Permissions.CREATE_COURSE,
    Permissions.DELETE_COURSE,
    Permissions.EDIT_COURSE,
    Permissions.ADD_STUDENT,
    Permissions.DELETE_STUDENT,
    Permissions.CREATE_QUIZ,
    Permissions.DELETE_QUIZ,
    Permissions.EDIT_QUIZ,
    Permissions.CREATE_MATERIAL,
    Permissions.DELETE_MATERIAL,
    Permissions.EDIT_MATERIAL,
  ],
  INSTRACTOR: [
    Permissions.CREATE_COURSE,
    Permissions.EDIT_COURSE,
    Permissions.CREATE_QUIZ,
    Permissions.EDIT_QUIZ,
    Permissions.CREATE_MATERIAL,
    Permissions.EDIT_MATERIAL,
    Permissions.ADD_STUDENT,
    Permissions.DELETE_STUDENT,
  ],
  STUDENT: [
    // Add student-specific permissions if needed
  ],
};
