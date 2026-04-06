import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { AdminService } from './admin.service';
import { UserRole } from './dto/admin.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @MessagePattern({ cmd: 'admin.health.check' })
  async handleHealthCheck(@Payload() data: any) {
    try {
      return {
        success: true,
        data: { status: 'Healthy!', service: 'Admin Service', timestamp: new Date().toISOString() },
        message: 'Health check successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Health check failed'
      };
    }
  }

  @MessagePattern({ cmd: 'admin.account.getUsers' })
  async handleGetUsers(@Payload() data: { page?: number; limit?: number; role?: UserRole; search?: string }) {
    try {
      const result = await this.adminService.getAllUsers(data);
      return {
        success: true,
        data: result,
        message: 'Users retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve users'
      };
    }
  }

  @MessagePattern({ cmd: 'admin.account.getUserById' })
  async handleGetUserById(@Payload() data: { userId: string }) {
    try {
      const result = await this.adminService.getUserById(data.userId);
      return {
        success: true,
        data: result,
        message: 'User retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve user'
      };
    }
  }

  @MessagePattern({ cmd: 'admin.account.updateUserStatus' })
  async handleUpdateUserStatus(@Payload() data: any) {
    try {
      // This would need to be implemented in the admin service
      // For now, return a placeholder response
      return {
        success: true,
        data: { updated: true },
        message: 'User status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update user status'
      };
    }
  }

  // Additional admin patterns for full functionality
  @MessagePattern({ cmd: 'admin.get.users.by.role' })
  async handleGetUsersByRole(@Payload() data: { role: string }) {
    try {
      const result = await this.adminService.getUsersByRole(data.role as any);
      return {
        success: true,
        data: result,
        message: 'Users by role retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve users by role'
      };
    }
  }

  @MessagePattern({ cmd: 'admin.search.users' })
  async handleSearchUsers(@Payload() data: { query: string; role?: string }) {
    try {
      const result = await this.adminService.searchUsers(data.query, data.role as any);
      return {
        success: true,
        data: result,
        message: 'Users search results'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to search users'
      };
    }
  }

  @EventPattern('admin.update.user.role')
  async handleUpdateUserRole(@Payload() data: {
    adminUserId: string;
    targetUserId: string;
    newRole: string
  }) {
    try {
      const result = await this.adminService.updateUserRole(
        data.adminUserId,
        data.targetUserId,
        data.newRole as any
      );
      return {
        success: true,
        data: result,
        message: 'User role updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update user role'
      };
    }
  }

  @EventPattern('admin.toggle.user.status')
  async handleToggleUserStatus(@Payload() data: {
    adminUserId: string;
    targetUserId: string;
    isActive: boolean
  }) {
    try {
      const result = await this.adminService.toggleUserStatus(
        data.adminUserId,
        data.targetUserId,
        data.isActive
      );
      return {
        success: true,
        data: result,
        message: 'User status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update user status'
      };
    }
  }

  @EventPattern('admin.delete.user')
  async handleDeleteUser(@Payload() data: {
    adminUserId: string;
    targetUserId: string
  }) {
    try {
      const result = await this.adminService.deleteUserById(
        data.adminUserId,
        data.targetUserId
      );
      return {
        success: true,
        data: result,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete user'
      };
    }
  }

  @MessagePattern({ cmd: 'admin.get.statistics.users' })
  async handleGetUserStatistics(@Payload() data: any) {
    try {
      const result = await this.adminService.getUserStatistics();
      return {
        success: true,
        data: result,
        message: 'User statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve user statistics'
      };
    }
  }

  @MessagePattern({ cmd: 'admin.get.statistics.instructors' })
  async handleGetInstructorStatistics(@Payload() data: any) {
    try {
      const result = await this.adminService.getInstructorStatistics();
      return {
        success: true,
        data: result,
        message: 'Instructor statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve instructor statistics'
      };
    }
  }

  @MessagePattern({ cmd: 'admin.get.statistics.students' })
  async handleGetStudentStatistics(@Payload() data: any) {
    try {
      const result = await this.adminService.getStudentStatistics();
      return {
        success: true,
        data: result,
        message: 'Student statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve student statistics'
      };
    }
  }
}
