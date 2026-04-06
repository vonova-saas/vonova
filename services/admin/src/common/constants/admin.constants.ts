export const ADMIN_PATTERNS = {
  HEALTH_CHECK: 'app.health.check',
  APP_INFO: 'app.info',
  USERS: 'admin.account.getUsers',
  USER_BY_ID: 'admin.account.getUserById',
  UPDATE_USER_STATUS: 'admin.account.updateUserStatus',
  UPDATE_USER_ROLE: 'admin.update.user.role',
  TOGGLE_USER_STATUS: 'admin.toggle.user.status',
  DELETE_USER: 'admin.delete.user',
  GET_USERS_BY_ROLE: 'admin.get.users.by.role',
  SEARCH_USERS: 'admin.search.users',
  GET_STATISTICS_USERS: 'admin.get.statistics.users',
  GET_STATISTICS_INSTRUCTORS: 'admin.get.statistics.instructors',
  GET_STATISTICS_STUDENTS: 'admin.get.statistics.students',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const;

export const RESPONSE_MESSAGES = {
  SUCCESS: {
    USERS_RETRIEVED: 'Users retrieved successfully',
    USER_RETRIEVED: 'User retrieved successfully',
    USERS_BY_ROLE_RETRIEVED: 'Users by role retrieved successfully',
    SEARCH_RESULTS: 'Users search results',
    ROLE_UPDATED: 'User role updated successfully',
    STATUS_UPDATED: 'User status updated successfully',
    USER_DELETED: 'User deleted successfully',
    USER_STATS_RETRIEVED: 'User statistics retrieved successfully',
    INSTRUCTOR_STATS_RETRIEVED: 'Instructor statistics retrieved successfully',
    STUDENT_STATS_RETRIEVED: 'Student statistics retrieved successfully',
    HEALTH_CHECK_SUCCESS: 'Health check successful',
    APP_INFO_RETRIEVED: 'App info retrieved successfully',
  },
  ERROR: {
    USERS_FAILED: 'Failed to retrieve users',
    USER_FAILED: 'Failed to retrieve user',
    USERS_BY_ROLE_FAILED: 'Failed to retrieve users by role',
    SEARCH_FAILED: 'Failed to search users',
    ROLE_UPDATE_FAILED: 'Failed to update user role',
    STATUS_UPDATE_FAILED: 'Failed to update user status',
    USER_DELETE_FAILED: 'Failed to delete user',
    USER_STATS_FAILED: 'Failed to retrieve user statistics',
    INSTRUCTOR_STATS_FAILED: 'Failed to retrieve instructor statistics',
    STUDENT_STATS_FAILED: 'Failed to retrieve student statistics',
    HEALTH_CHECK_FAILED: 'Health check failed',
    APP_INFO_FAILED: 'Failed to retrieve app info',
  },
} as const;
