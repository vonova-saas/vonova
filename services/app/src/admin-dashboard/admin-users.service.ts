import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../auth/schema/user.schema';
import { AdminActivityService } from './admin-activity.service';
import { mapQueryRoleToDbRole } from './utils/admin-role-mapping.util';
import { computeIsOnline } from './utils/presence.util';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly activityService: AdminActivityService,
  ) {}

  async getAllUsersWithPresence(params: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    const dbRole = mapQueryRoleToDbRole(role);
    if (dbRole) filter.role = dbRole;
    if (isActive !== undefined) filter.isActive = isActive;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      this.userModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(filter),
    ]);

    const ids = users.map((u) => u._id as Types.ObjectId);
    const activityMap = await this.activityService.findByUserIds(ids);

    const usersOut = users.map((u) => {
      const id = String(u._id);
      const act = activityMap.get(id);
      const lastSeenAt = act?.lastSeenAt ? new Date(act.lastSeenAt) : undefined;
      const { password: _pw, ...rest } = u as Record<string, unknown> & {
        password?: string;
      };
      void _pw;
      return {
        ...rest,
        lastSeenAt: lastSeenAt ?? null,
        isOnline: computeIsOnline(lastSeenAt),
      };
    });

    return {
      users: usersOut,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId).select('-__v').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const activityMap = await this.activityService.findByUserIds([
      user._id as Types.ObjectId,
    ]);
    const act = activityMap.get(String(user._id));
    const lastSeenAt = act?.lastSeenAt ? new Date(act.lastSeenAt) : null;
    const { password: _pw, ...rest } = user as Record<string, unknown> & {
      password?: string;
    };
    void _pw;
    return {
      ...rest,
      lastSeenAt,
      isOnline: computeIsOnline(lastSeenAt),
    };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: { isActive } }, { new: true })
      .lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { updated: true, userId: String(user._id), isActive: user.isActive };
  }
}
