import { Request, Response, NextFunction } from "express";
import { UserRoleEnum, UserRoleType, isValidUserRole } from "../../enums/user-role.enum"
import { ForbiddenException } from "../../utils/appError";

export const isAuthorized = (allowedRoles: UserRoleType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenException("Authentication required");
      }

      if (!allowedRoles.includes(req.user.role as UserRoleType)) {
        throw new ForbiddenException("Insufficient permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Specific role middleware
export const isAdmin = isAuthorized([UserRoleEnum.ADMIN]);
export const isInstructor = isAuthorized([UserRoleEnum.INSTRUCTOR, UserRoleEnum.ADMIN]);
export const isStudent = isAuthorized([UserRoleEnum.STUDENT, UserRoleEnum.INSTRUCTOR, UserRoleEnum.ADMIN]);
export const isInstructorOrAdmin = isAuthorized([UserRoleEnum.INSTRUCTOR, UserRoleEnum.ADMIN]);


// Self-access middleware (users can access their own data)
export const canAccessOwnData = (paramName: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenException("Authentication required");
      }

      const targetUserId = req.params[paramName];

      // Users can access their own data, admins can access any data
      if (req.user.id === targetUserId || req.user.role === UserRoleEnum.ADMIN) {
        return next();
      }

      throw new ForbiddenException("You can only access your own data");
    } catch (error) {
      next(error);
    }
  };
};
