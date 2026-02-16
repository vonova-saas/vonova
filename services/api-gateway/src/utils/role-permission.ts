import {
  Permissions,
  PermissionType,
  RoleType,
} from "../enums/role.enum";

export const RolePermissions: Record<RoleType, Array<PermissionType>> = {
  PENDING: [
    Permissions.CREATE_ACCOUNT
  ],

  // --------------------------------------
  // Students Users
  // --------------------------------------
  STUDENT_USER: [
    // LMS
    // Courses
    Permissions.ENROLL_COURSE,
    Permissions.VIEW_INSTRUCTORS,
    // Quizzes
    Permissions.VIEW_QUIZ,
    Permissions.SUBMIT_QUIZ,
    Permissions.VIEW_GRADES,
    Permissions.VIEW_ASSIGNMENT,
    Permissions.SUBMIT_ASSIGNMENT,
    Permissions.VIEW_ASSIGNMENT_GRADES,
    // Library
    Permissions.VIEW_LIBRARY_ITEM,
    Permissions.READ_LIBRARY_ITEM,
    Permissions.WRITE_LIBRARY_REVIEW,

    // AI LMS Tools (Student-focused)
    // Problem Solving
    Permissions.VIEW_STUDENT_PROBLEMS_SOLVING_CONTEST,
    Permissions.ENROLL_PROBLEMS_SOLVING_CONTEST,
    Permissions.VIEW_STUDENT_PROBLEMS_SOLVING_PROBLEM,
    Permissions.SUBMIT_STUDENT_PROBLEMS_SOLVING_PROBLEM,
    // Roadmap
    Permissions.AI_ROADMAP_GENERATOR,
    Permissions.GENRATE_ROADMAP,
    Permissions.VIEW_ROADMAPS,
    Permissions.DELETE_ROADMAP,
    // AI Assistant
    Permissions.AI_CODE_ASSISTANT,
    Permissions.CREATE_CHAT,
    Permissions.VIEW_CHATS,
    Permissions.UPDATE_CHAT,
    Permissions.DELETE_CHAT,
    // Topic Video Generator
    Permissions.AI_TOPIC_VIDEO_GENERATION,
    // Problem Solving Coach
    Permissions.AI_PRACTICE_PROBLEMS_SOLVING,
    // Pdf Summary
    Permissions.AI_PDF_SUMMARY,

    // Settings & Account & Notifications & Billing
    Permissions.EDIT_ACCOUNT,
    Permissions.VIEW_ACCOUNT,
    Permissions.CHANGE_PASSWORD,
    Permissions.MANAGE_SETTINGS,
    Permissions.VIEW_SETTINGS,
    Permissions.MANAGE_NOTIFICATIONS,
    Permissions.VIEW_NOTIFICATIONS,
    Permissions.MANAGE_BILLING,
    Permissions.VIEW_BILLING,

    // Support
    Permissions.CREATE_SUPPORT,
    Permissions.VIEW_SUPPORT,
    Permissions.EDIT_SUPPORT,
    Permissions.DELETE_SUPPORT,

    // Feedback
    Permissions.CREATE_FEEDBACK,
    Permissions.VIEW_FEEDBACK,
    Permissions.EDIT_FEEDBACK,
    Permissions.DELETE_FEEDBACK,
  ],

  // --------------------------------------
  // Instructors Users
  // --------------------------------------
  INSTRUCTORS_USER: [
    // Student Management
    Permissions.VIEW_STUDENTS,
    Permissions.MANAGE_STUDENT_PROGRESS,
    Permissions.DELETE_STUDENT,
    // Course Management
    Permissions.MANAGE_COURSE,
    Permissions.VIEW_COURSE,
    Permissions.ASSIGN_COURSE,
    // Quiz Management
    Permissions.CREATE_QUIZ,
    Permissions.VIEW_QUIZ,
    Permissions.EDIT_QUIZ,
    Permissions.GRADE_QUIZ,
    Permissions.DELETE_QUIZ,
    Permissions.CREATE_ASSIGNMENT,
    Permissions.VIEW_ASSIGNMENT,
    Permissions.EDIT_ASSIGNMENT,
    Permissions.GRADE_ASSIGNMENT,
    Permissions.DELETE_ASSIGNMENT,
    // Problem Solving
    Permissions.CREATE_PROBLEMS_SOLVING_CONTEST,
    Permissions.VIEW_INSTRUCTOR_PROBLEMS_SOLVING_CONTEST,
    Permissions.EDIT_PROBLEMS_SOLVING_CONTEST,
    Permissions.DELETE_PROBLEMS_SOLVING_CONTEST,
    Permissions.ADD_PROBLEMS_SOLVING_PROBLEM,
    Permissions.VIEW_INSTRUCTOR_PROBLEMS_SOLVING_PROBLEM,
    Permissions.EDIT_PROBLEMS_SOLVING_PROBLEM,
    Permissions.DELETE_PROBLEMS_SOLVING_PROBLEM,
    // Material Management
    Permissions.MANAGE_LIBRARY_ITEM,
    Permissions.VIEW_LIBRARY_ITEM,
    Permissions.READ_LIBRARY_ITEM,
    Permissions.WRITE_LIBRARY_REVIEW,
    Permissions.PUBLISH_LIBRARY_ITEM,
    // Certificates
    Permissions.GENERATE_CERTIFICATE,
    Permissions.VIEW_CERTIFICATE,

    // Settings & Account & Notifications & Billing
    Permissions.EDIT_ACCOUNT,
    Permissions.VIEW_ACCOUNT,
    Permissions.CHANGE_PASSWORD,
    Permissions.MANAGE_SETTINGS,
    Permissions.VIEW_SETTINGS,
    Permissions.MANAGE_NOTIFICATIONS,
    Permissions.VIEW_NOTIFICATIONS,
    Permissions.MANAGE_BILLING,
    Permissions.VIEW_BILLING,

    // Support
    Permissions.CREATE_SUPPORT,
    Permissions.VIEW_SUPPORT,
    Permissions.EDIT_SUPPORT,
    Permissions.DELETE_SUPPORT,

    // Feedback
    Permissions.CREATE_FEEDBACK,
    Permissions.VIEW_FEEDBACK,
    Permissions.EDIT_FEEDBACK,
    Permissions.DELETE_FEEDBACK,
  ],

  // --------------------------------------
  // Owner (All Permissions)
  // --------------------------------------
  OWNER: Object.values(Permissions) as Array<PermissionType>,
};
