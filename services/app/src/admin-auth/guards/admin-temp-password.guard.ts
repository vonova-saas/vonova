/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from '../schemas/admin.schema';

@Injectable()
export class AdminTempPasswordGuard implements CanActivate {
  constructor(
    @InjectModel(Admin.name, 'adminConnection')
    private readonly adminModel: Model<AdminDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { adminId?: string; role?: string } | undefined;

    if (!user?.adminId) {
      throw new ForbiddenException('Admin ID not found in request');
    }

    // Fetch admin from admin database
    const admin = await this.adminModel.findById(user.adminId).exec();

    if (!admin) {
      throw new ForbiddenException('Admin not found');
    }

    if (admin.isTempPassword) {
      throw new ForbiddenException(
        'You must reset your temporary password before accessing other endpoints. Please use POST /api/v1/admin/auth/reset-password',
      );
    }

    return true;
  }
}
