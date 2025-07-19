import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware";
import { isAdmin, canAccessOwnData } from "../middlewares/auth/isAuthorized.middleware";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import {
  getAllUsersController,
  getUserByIdController,
  getUsersByRoleController,
  getUserStatisticsController,
  getInstructorStatisticsController,
  getStudentStatisticsController,
  searchUsersController,
  updateUserRoleController,
  toggleUserStatusController,
  deleteUserByIdController,
} from "../controllers/admin.controller";
import { updateUserRoleSchema, toggleUserStatusSchema, getAllUsersQuerySchema } from "../validation/admin.validation";

const adminRoutes = Router();

// All admin routes require authentication and admin role
adminRoutes.use(isAuthenticated);
adminRoutes.use(isAdmin);

// User management routes
adminRoutes.get("/users", validateRequest(getAllUsersQuerySchema), getAllUsersController);
adminRoutes.get("/users/:userId", getUserByIdController);
adminRoutes.get("/users/by-role", getUsersByRoleController);
adminRoutes.get("/users/search", searchUsersController);
adminRoutes.put("/users/:userId/role", validateRequest(updateUserRoleSchema), updateUserRoleController);
adminRoutes.put("/users/:userId/status", validateRequest(toggleUserStatusSchema), toggleUserStatusController);
adminRoutes.delete("/users/:userId", deleteUserByIdController);

// Statistics routes
adminRoutes.get("/statistics/users", getUserStatisticsController);
adminRoutes.get("/statistics/instructors", getInstructorStatisticsController);
adminRoutes.get("/statistics/students", getStudentStatisticsController);

export default adminRoutes; 