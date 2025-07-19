import { Request, Response, NextFunction } from "express";
import { PermissionType } from "../../enums/role.enum";
import { UnauthorizedException } from "../../utils/appError";
import { RolePermissions } from "../../utils/role-permission";

export const isAuthorization = (
  requiredPermissions: PermissionType[]
) => (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  // if (!user) throw new UnauthorizedException("Authentication required");

  const role = (user as any).role as keyof typeof RolePermissions;
  if (!role || !(role in RolePermissions)) {
    throw new UnauthorizedException("Invalid user role");
  }

  const permissions = RolePermissions[role];
  const hasPermission = requiredPermissions.every((permission) =>
    permissions.includes(permission)
  );

  if (!hasPermission) {
    throw new UnauthorizedException(
      "You do not have the necessary permissions to perform this action"
    );
  }
  next();
};