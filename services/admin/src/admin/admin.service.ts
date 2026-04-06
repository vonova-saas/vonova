import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from './dto/admin.dto';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  private authClient: ClientProxy;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    this.authClient = ClientProxyFactory.create({
      transport: Transport.NATS,
      options: {
        servers: this.configService.get<string>('NATS_URL', 'nats://localhost:4222'),
        queue: 'auth_queue',
      },
    });
  }

  async getAllUsers(params: {
    page?: number;
    limit?: number;
    role?: UserRole;
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
      sortOrder = 'desc'
    } = params;

    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter: any = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort query
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      this.userModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      this.userModel.countDocuments(filter)
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findOne({ _id: userId }).select('-__v');
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async getUsersByRole(role: UserRole) {
    const users = await this.userModel.find({
      role,
      isActive: true
    }).select('_id name email role avatar lastLoginAt createdAt');

    return users;
  }

  async searchUsers(query: string, role?: UserRole) {
    const filter: any = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    };

    if (role) {
      filter.role = role;
    }

    const users = await this.userModel.find(filter)
      .select('_id name email role avatar bio')
      .limit(20);

    return users;
  }

  async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole
  ) {
    // Verify admin permissions
    const admin = await this.userModel.findOne({ _id: adminUserId });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin access required");
    }

    // Validate role change with auth service via NATS
    try {
      const validationResult = await this.authClient.send('auth.validate.role.change', {
        userId: targetUserId,
        newRole: newRole,
        adminUserId: adminUserId
      }).toPromise();

      if (!validationResult.valid) {
        throw new BadRequestException("Role change validation failed");
      }
    } catch (error: any) {
      console.warn("Auth service unavailable, using local validation:", error.message);
      
      const user = await this.userModel.findOne({ _id: targetUserId });
      if (!user) {
        throw new NotFoundException("User not found");
      }

      // Basic local validation
      if (user.role === newRole) {
        throw new BadRequestException("User already has the specified role");
      }

      // Prevent changing to ADMIN role through this endpoint
      if (newRole === UserRole.ADMIN) {
        throw new BadRequestException("Cannot assign ADMIN role through this endpoint");
      }
    }

    // Apply the role change
    const user = await this.userModel.findOne({ _id: targetUserId });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    return {
      user,
      message: `User role updated from ${oldRole} to ${newRole}`,
      validation: "Role change validated with auth service"
    };
  }

  async toggleUserStatus(
    adminUserId: string,
    targetUserId: string,
    isActive: boolean
  ) {
    const admin = await this.userModel.findOne({ _id: adminUserId });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin access required");
    }

    const user = await this.userModel.findOne({ _id: targetUserId });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Prevent admin from deactivating themselves
    if (adminUserId === targetUserId) {
      throw new BadRequestException("Cannot deactivate your own account");
    }

    user.isActive = isActive;
    await user.save();

    return {
      user,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    };
  }

  async deleteUserById(adminUserId: string, targetUserId: string) {
    // Ensure the requester is an admin
    const admin = await this.userModel.findOne({ _id: adminUserId });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin access required");
    }

    // Prevent admin from deleting themselves
    if (adminUserId === targetUserId) {
      throw new BadRequestException("You cannot delete your own account");
    }

    // Find and delete the user
    const user = await this.userModel.findOneAndDelete({ _id: targetUserId });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      message: "User deleted successfully",
      userId: targetUserId
    };
  }

  async getUserStatistics() {
    const stats = await this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          verifiedCount: {
            $sum: { $cond: ['$isVerified', 1, 0] }
          }
        }
      }
    ]);

    const totalUsers = await this.userModel.countDocuments();
    const activeUsers = await this.userModel.countDocuments({ isActive: true });
    const verifiedUsers = await this.userModel.countDocuments({ isVerified: true });

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      byRole: stats,
      recentRegistrations: await this.userModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    };
  }

  async getInstructorStatistics() {
    const instructors = await this.userModel.find({ 
      role: UserRole.INSTRUCTOR,
      isActive: true 
    });

    const stats = {
      totalInstructors: instructors.length,
      byExperience: {
        beginner: instructors.filter(i => (i.experience || 0) < 2).length,
        intermediate: instructors.filter(i => (i.experience || 0) >= 2 && (i.experience || 0) < 5).length,
        expert: instructors.filter(i => (i.experience || 0) >= 5).length
      },
      bySpecialization: instructors.reduce((acc, instructor) => {
        instructor.specialization?.forEach((spec: string) => {
          acc[spec] = (acc[spec] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  }

  async getStudentStatistics() {
    const students = await this.userModel.find({ 
      role: UserRole.STUDENT,
      isActive: true 
    });

    const stats = {
      totalStudents: students.length,
      byLevel: {
        beginner: students.filter(s => s.level === 'beginner').length,
        intermediate: students.filter(s => s.level === 'intermediate').length,
        advanced: students.filter(s => s.level === 'advanced').length
      },
      byLearningStyle: students.reduce((acc, student) => {
        const style = student.preferredLearningStyle || 'unknown';
        acc[style] = (acc[style] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  }
}
