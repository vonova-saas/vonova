import {
  Permissions,
  PermissionType,
  RoleType,
} from "../enums/role.enum";

export const RolePermissions: Record<RoleType, Array<PermissionType>> = {
  ADMIN: [
    // Instructor Management
    Permissions.ADD_INSTRUCTOR,
    Permissions.DELETE_INSTRUCTOR,
    Permissions.EDIT_INSTRUCTOR,
    Permissions.VIEW_INSTRUCTORS,

    // Student Management
    Permissions.ADD_STUDENT,
    Permissions.DELETE_STUDENT,
    Permissions.EDIT_STUDENT,
    Permissions.VIEW_STUDENTS,

    // Course Management
    Permissions.CREATE_COURSE,
    Permissions.EDIT_COURSE,
    Permissions.DELETE_COURSE,
    Permissions.VIEW_COURSE,
    Permissions.ASSIGN_COURSE,

    // Quiz Management
    Permissions.CREATE_QUIZ,
    Permissions.EDIT_QUIZ,
    Permissions.DELETE_QUIZ,
    Permissions.VIEW_QUIZ,
    Permissions.GRADE_QUIZ,

    // Material Management
    Permissions.CREATE_MATERIAL,
    Permissions.EDIT_MATERIAL,
    Permissions.DELETE_MATERIAL,
    Permissions.VIEW_MATERIAL,

    // Discussion
    Permissions.MODERATE_DISCUSSION,

    // User Management
    Permissions.EDIT_PROFILE,
    Permissions.VIEW_PROFILE,
    Permissions.CHANGE_PASSWORD,

    // Admin Dashboards
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_ANALYTICS,

    // Notifications
    Permissions.MANAGE_NOTIFICATIONS,
    Permissions.VIEW_NOTIFICATIONS,

    // Certificates
    Permissions.GENERATE_CERTIFICATE,
    Permissions.VIEW_CERTIFICATE,

    // Platform Settings
    Permissions.MANAGE_ROLES,
    Permissions.VIEW_LOGS,
    Permissions.SYSTEM_SETTINGS,
  ],

  INSTRUCTOR: [
    // Student + course interactions
    Permissions.ADD_STUDENT,
    Permissions.DELETE_STUDENT,
    Permissions.EDIT_STUDENT,
    Permissions.VIEW_STUDENTS,

    // Course
    Permissions.CREATE_COURSE,
    Permissions.EDIT_COURSE,
    Permissions.VIEW_COURSE,
    Permissions.ASSIGN_COURSE,

    // Quiz
    Permissions.CREATE_QUIZ,
    Permissions.EDIT_QUIZ,
    Permissions.DELETE_QUIZ,
    Permissions.VIEW_QUIZ,
    Permissions.GRADE_QUIZ,

    // Materials
    Permissions.CREATE_MATERIAL,
    Permissions.EDIT_MATERIAL,
    Permissions.DELETE_MATERIAL,
    Permissions.VIEW_MATERIAL,

    // Discussions
    Permissions.CREATE_DISCUSSION,
    Permissions.REPLY_DISCUSSION,
    Permissions.MODERATE_DISCUSSION,

    // Dashboard
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_ANALYTICS,

    // User
    Permissions.EDIT_PROFILE,
    Permissions.VIEW_PROFILE,
    Permissions.CHANGE_PASSWORD,

    // Notifications
    Permissions.VIEW_NOTIFICATIONS,

    // Certificates
    Permissions.GENERATE_CERTIFICATE,
    Permissions.VIEW_CERTIFICATE,
  ],

  STUDENT: [
    // View assigned courses
    Permissions.VIEW_COURSE,
    Permissions.VIEW_MATERIAL,
    Permissions.VIEW_QUIZ,

    // Interact with quizzes
    Permissions.REPLY_DISCUSSION,
    Permissions.VIEW_DASHBOARD,

    // Submit quizzes (could be custom)
    Permissions.VIEW_ANALYTICS,

    // Discussions
    Permissions.CREATE_DISCUSSION,
    Permissions.REPLY_DISCUSSION,

    // Certificates
    Permissions.VIEW_CERTIFICATE,

    // Notifications
    Permissions.VIEW_NOTIFICATIONS,

    // User settings
    Permissions.EDIT_PROFILE,
    Permissions.VIEW_PROFILE,
    Permissions.CHANGE_PASSWORD,
  ],
};
