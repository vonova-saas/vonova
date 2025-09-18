import { Request, Response, NextFunction } from "express";
import { PermissionType } from "../../enums/role.enum";
import { UnauthorizedException } from "../../utils/appError";
import { RolePermissions } from "../../utils/role-permission";
import { UserDocument } from "../../models/auth/user.model";

interface AuthorizationOptions {
  permissions?: PermissionType[];
  allowSelf?: boolean; // Allow access if user acts on their own resource
  paramKey?: string;   // Route param key to check for ownership (default: "userId")
}

export const isAuthorization =
  (options: AuthorizationOptions = {}) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user as UserDocument;
    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }

    const { permissions = [], allowSelf = false, paramKey = "userId" } = options;

    // 1. Ownership check
    if (allowSelf) {
      const targetId = req.params[paramKey];
      if (targetId && user.id === targetId) {
        return next(); // allow user to access their own resource
      }
    }

    // 2. Role check
    const role = user.role as keyof typeof RolePermissions;
    if (!role || !(role in RolePermissions)) {
      throw new UnauthorizedException("Invalid user role");
    }

    const rolePermissions = RolePermissions[role];

    // 3. Permission check
    const hasPermission = permissions.every((p) => rolePermissions.includes(p));
    if (!hasPermission) {
      throw new UnauthorizedException(
        "You do not have the necessary permissions to perform this action"
      );
    }

    return next();
  };
