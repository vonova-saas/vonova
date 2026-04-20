//! App API Services
//? ************* Auth *************
import {
  loginMutationFn,
  refreshTokenMutationFn,
  logoutMutationFn,
  getCurrentUserQueryFn,
} from "./auth/auth.api";

//? ************* Admin *************
import {
  getUsersQueryFn,
  getUserQueryFn,
  updateUserStatusMutationFn,
  getPendingInstructorsQueryFn,
  approveInstructorMutationFn,
  rejectInstructorMutationFn,
} from "./admin/admin.api";

//? ************* Settings *************
//? ************* Account *************
//? ************* Notification *************
//? ************* Support *************

//! Dev API Services
//! User API Services

export {
  // app services
  //? auth api services
  loginMutationFn,
  refreshTokenMutationFn,
  logoutMutationFn,
  getCurrentUserQueryFn,

  //? admin api services
  getUsersQueryFn,
  getUserQueryFn,
  updateUserStatusMutationFn,
  getPendingInstructorsQueryFn,
  approveInstructorMutationFn,
  rejectInstructorMutationFn,

  //? settings api services
  //? account api services
  //? notification api services
  //? support api services

  // dev services
  // user services
}