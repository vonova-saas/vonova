import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PermissionType } from '../../enums/role.enum';
import { RolePermissions } from '../../utils/role-permission';
import { UserDocument } from '../../models/auth/user.model';

export const PERMISSIONS_KEY = 'permissions';
export const ALLOW_SELF_KEY = 'allowSelf';
export const PARAM_KEY = 'paramKey';

export const RequirePermissions = (permissions: PermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const AllowSelf = (paramKey: string = 'userId') =>
  SetMetadata(ALLOW_SELF_KEY, { allowSelf: true, paramKey });

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as UserDocument;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<PermissionType[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    ) || [];

    const allowSelfConfig = this.reflector.getAllAndOverride<{ allowSelf: boolean; paramKey: string }>(
      ALLOW_SELF_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 1. Ownership check
    if (allowSelfConfig?.allowSelf) {
      const targetId = request.params[allowSelfConfig.paramKey || 'userId'];
      if (targetId && user.id === targetId) {
        return true; // allow user to access their own resource
      }
    }

    // 2. Role check
    const role = user.role as keyof typeof RolePermissions;
    if (!role || !(role in RolePermissions)) {
      throw new UnauthorizedException('Invalid user role');
    }

    const rolePermissions = RolePermissions[role];

    // 3. Permission check
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every((p) =>
        rolePermissions.includes(p),
      );
      if (!hasPermission) {
        throw new UnauthorizedException(
          'You do not have the necessary permissions to perform this action',
        );
      }
    }

    return true;
  }
}

