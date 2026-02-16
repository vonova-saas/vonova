import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../models/auth/user.model';
import { RolePermissions } from '../../utils/role-permission';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = request.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('Access token required');
    }

    const { payload, error } = verifyAccessToken(accessToken);

    if (error || !payload) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    // Verify user still exists and is active
    const user = await this.userModel.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // Attach to request
    (request as any).user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      permissions: RolePermissions[user.role as keyof typeof RolePermissions] || [],
    };
    (request as any).userDoc = user;
    (request as any).userId = user._id.toString();

    return true;
  }
}

