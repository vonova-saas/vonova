import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AdminGatewayService } from './admin.service';
import { UpdateAdminUserStatusDto } from './dto/update-user-status.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('api/v1/admin')
export class AdminGatewayController {
  constructor(private readonly adminService: AdminGatewayService) {}

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return firstValueFrom(
      this.adminService.getUsers({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        role,
        search,
      }),
    );
  }

  @Get('users/:userId')
  getUserById(@Param('userId') userId: string) {
    return firstValueFrom(this.adminService.getUserById(userId));
  }

  @Patch('users/status')
  updateUserStatus(@Body() dto: UpdateAdminUserStatusDto) {
    return firstValueFrom(this.adminService.updateUserStatus(dto));
  }
}
