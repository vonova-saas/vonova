import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  getAllUsersService,
  getUserByIdService,
  getUsersByRoleService,
  searchUsersService,
  updateUserRoleService,
  toggleUserStatusService,
  getUserStatisticsService,
  getInstructorStatisticsService,
  getStudentStatisticsService,
  deleteUserByIdService,
} from "../services/admin.service";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { updateUserRoleSchema, toggleUserStatusSchema } from "../validation/admin.validation";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        isVerified: boolean;
      };
    }
  }
}

//? ============= User management routes =============
// Get all users with pagination and filtering
export const getAllUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    // After validation, req.query is already typed and coerced
    const { page, limit, role, isActive, search, sortBy, sortOrder } = req.query as any;
    const result = await getAllUsersService({
      page,
      limit,
      role,
      isActive,
      search,
      sortBy,
      sortOrder
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Users retrieved successfully",
      data: result,
    });
  }
);

// Get user by ID (admin access)
export const getUserByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = await getUserByIdService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User retrieved successfully",
      data: user,
    });
  }
);

// Get users by role
export const getUsersByRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const { role } = req.query;
    if (!role) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Role query parameter is required"
      });
    }
    const users = await getUsersByRoleService(role as any);
    return res.status(HTTPSTATUS.OK).json({
      message: "Users by role retrieved successfully",
      data: users,
    });
  }
);

// Search users
export const searchUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const { query, role } = req.query;
    if (!query) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Query parameter is required"
      });
    }
    const users = await searchUsersService(query as string, role as any);
    return res.status(HTTPSTATUS.OK).json({
      message: "Users search results",
      data: users,
    });
  }
);

// Update user role (admin only)
export const updateUserRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { newRole } = req.body;
    const adminUserId = req.user!.id;

    const result = await updateUserRoleService(adminUserId, userId, newRole);

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
      data: result.user,
      validation: result.validation,
    });
  }
);

// Deactivate/Activate user
export const toggleUserStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { isActive } = req.body;
    const adminUserId = req.user!.id;

    const result = await toggleUserStatusService(adminUserId, userId, isActive);

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
      data: result.user,
    });
  }
);

// Delete user by id
export const deleteUserByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const adminUserId = req.user!.id;
    const result = await deleteUserByIdService(adminUserId, userId);
    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
      userId: result.userId,
    });
  }
);

//* ============= Statistics routes =============
// Get user statistics
export const getUserStatisticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await getUserStatisticsService();

    return res.status(HTTPSTATUS.OK).json({
      message: "User statistics retrieved successfully",
      data: stats,
    });
  }
);

// Get instructor statistics
export const getInstructorStatisticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await getInstructorStatisticsService();

    return res.status(HTTPSTATUS.OK).json({
      message: "Instructor statistics retrieved successfully",
      data: stats,
    });
  }
);

// Get student statistics
export const getStudentStatisticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await getStudentStatisticsService();

    return res.status(HTTPSTATUS.OK).json({
      message: "Student statistics retrieved successfully",
      data: stats,
    });
  }
);
