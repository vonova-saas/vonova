import { z } from "zod";
import { UserRoleEnum } from "../enums/user-role.enum";

export const updateUserRoleSchema = z.object({
  newRole: z.enum([UserRoleEnum.STUDENT, UserRoleEnum.INSTRUCTOR], {
    required_error: "New role is required",
    invalid_type_error: "Role must be either STUDENT or INSTRUCTOR"
  }),
});

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean({
    required_error: "isActive is required",
    invalid_type_error: "isActive must be a boolean",
  }),
});

export const getAllUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  role: z.enum([UserRoleEnum.ADMIN, UserRoleEnum.INSTRUCTOR, UserRoleEnum.STUDENT, UserRoleEnum.PENDING]).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().min(1).optional(),
  sortBy: z.enum(['name', 'email', 'role', 'createdAt', 'lastLogin']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}); 