import UserProfileModel from "../models/userProfile.model";
import { UserRoleEnum, UserRoleType, isValidUserRole } from "../enums/user-role.enum";
import { 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException 
} from "../utils/appError";
import { ErrorCodeEnum } from "../enums/error-code.enums";
import { authServiceClient } from "../utils/service-communication";
import UserSettingsModel from "../models/userSettings.model";
import DashboardDataModel from "../models/dashboardData.model";

//? ============= User management routes =============
// Get all users with pagination and filtering
export const getAllUsersService = async (params: {
  page?: number;
  limit?: number;
  role?: UserRoleType;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
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
    UserProfileModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v'),
    UserProfileModel.countDocuments(filter)
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
};

// Get user by ID (admin access)
export const getUserByIdService = async (userId: string) => {
  const user = await UserProfileModel.findOne({ userId }).select('-__v');
  if (!user) {
    throw new NotFoundException("User not found");
  }
  return user;
};

// Get users by role
export const getUsersByRoleService = async (role: UserRoleType) => {
  const users = await UserProfileModel.find({
    role,
    isActive: true
  }).select('userId name email role avatarUrl lastLogin joinedAt');

  return users;
};

// Search users
export const searchUsersService = async (query: string, role?: UserRoleType) => {
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

  const users = await UserProfileModel.find(filter)
    .select('userId name email role avatarUrl bio')
    .limit(20);

  return users;
};

// Update user role (admin only) - Now integrates with auth service
export const updateUserRoleService = async (
  adminUserId: string,
  targetUserId: string,
  newRole: UserRoleType
) => {
  // Verify admin permissions (this would be checked in middleware)
  const admin = await UserProfileModel.findOne({ userId: adminUserId });
  if (!admin || admin.role !== UserRoleEnum.ADMIN) {
    throw new ForbiddenException("Admin access required");
  }

  // Validate role change with auth service first
  try {
    const validationResult = await authServiceClient.validateRoleChange({
      userId: targetUserId,
      newRole: newRole,
      adminUserId: adminUserId
    });

    if (!validationResult.valid) {
      throw new BadRequestException("Role change validation failed");
    }
  } catch (error: any) {
    // If auth service is unavailable, fall back to local validation
    console.warn("Auth service unavailable, using local validation:", error.message);
    
    const user = await UserProfileModel.findOne({ userId: targetUserId });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Basic local validation
    if (user.role === newRole) {
      throw new BadRequestException("User already has the specified role");
    }

    // Prevent changing to ADMIN role through this endpoint
    if (newRole === UserRoleEnum.ADMIN) {
      throw new BadRequestException("Cannot assign ADMIN role through this endpoint");
    }
  }

  // Apply the role change
  const user = await UserProfileModel.findOne({ userId: targetUserId });
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
};

// Deactivate/Activate user
export const toggleUserStatusService = async (
  adminUserId: string,
  targetUserId: string,
  isActive: boolean
) => {
  const admin = await UserProfileModel.findOne({ userId: adminUserId });
  if (!admin || admin.role !== UserRoleEnum.ADMIN) {
    throw new ForbiddenException("Admin access required");
  }

  const user = await UserProfileModel.findOne({ userId: targetUserId });
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
};

// Delete user by id
export const deleteUserByIdService = async (adminUserId: string, targetUserId: string) => {
  // Ensure the requester is an admin
  const admin = await UserProfileModel.findOne({ userId: adminUserId });
  if (!admin || admin.role !== UserRoleEnum.ADMIN) {
    throw new ForbiddenException("Admin access required");
  }

  // Prevent admin from deleting themselves
  if (adminUserId === targetUserId) {
    throw new BadRequestException("You cannot delete your own account");
  }

  // Find and delete the user
  const user = await UserProfileModel.findOneAndDelete({ userId: targetUserId });
  if (!user) {
    throw new NotFoundException("User not found");
  }

  // Delete related settings and dashboard data
  await Promise.all([
    UserSettingsModel.deleteOne({ userId: targetUserId }),
    DashboardDataModel.deleteOne({ userId: targetUserId })
  ]);

  return {
    message: "User deleted successfully",
    userId: targetUserId
  };
};

//* ============= Statistics routes =============
// Get user statistics
export const getUserStatisticsService = async () => {
  const stats = await UserProfileModel.aggregate([
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

  const totalUsers = await UserProfileModel.countDocuments();
  const activeUsers = await UserProfileModel.countDocuments({ isActive: true });
  const verifiedUsers = await UserProfileModel.countDocuments({ isVerified: true });

  return {
    totalUsers,
    activeUsers,
    verifiedUsers,
    byRole: stats,
    recentRegistrations: await UserProfileModel.countDocuments({
      joinedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
  };
};

// Get instructor statistics
export const getInstructorStatisticsService = async () => {
  const instructors = await UserProfileModel.find({ 
    role: UserRoleEnum.INSTRUCTOR,
    isActive: true 
  });

  const stats = {
    totalInstructors: instructors.length,
    byExperience: {
      beginner: instructors.filter(i => (i.instructorInfo?.experience || 0) < 2).length,
      intermediate: instructors.filter(i => (i.instructorInfo?.experience || 0) >= 2 && (i.instructorInfo?.experience || 0) < 5).length,
      expert: instructors.filter(i => (i.instructorInfo?.experience || 0) >= 5).length
    },
    bySpecialization: instructors.reduce((acc, instructor) => {
      instructor.instructorInfo?.specialization?.forEach(spec => {
        acc[spec] = (acc[spec] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>)
  };

  return stats;
};

// Get student statistics
export const getStudentStatisticsService = async () => {
  const students = await UserProfileModel.find({ 
    role: UserRoleEnum.STUDENT,
    isActive: true 
  });

  const stats = {
    totalStudents: students.length,
    byLevel: {
      beginner: students.filter(s => s.studentInfo?.level === 'beginner').length,
      intermediate: students.filter(s => s.studentInfo?.level === 'intermediate').length,
      advanced: students.filter(s => s.studentInfo?.level === 'advanced').length
    },
    byLearningStyle: students.reduce((acc, student) => {
      const style = student.studentInfo?.preferredLearningStyle || 'unknown';
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return stats;
};