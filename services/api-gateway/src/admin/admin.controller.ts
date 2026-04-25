import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGatewayService } from './admin.service';
import { UpdateAdminUserStatusDto } from './dto/update-user-status.dto';
import { ReplyAdminSupportDto } from './dto/reply-admin-support.dto';
import { UpdateAdminSupportStatusDto } from './dto/update-admin-support-status.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminJwtAuthGuard } from 'src/common/guards/admin-jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';

const ADMIN_ACCOUNT_AVATAR_MAX_BYTES = 8 * 1024 * 1024;

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('api/v1/admin')
@UseGuards(AdminJwtAuthGuard, AdminGuard)
@ApiUnauthorizedResponse({
  description:
    'No or invalid session. The gateway reads `accessToken` from cookies and validates via `currentUser`.',
  schema: {
    example: {
      statusCode: 401,
      message: 'Access token is required',
    },
  },
})
@ApiForbiddenResponse({
  description:
    'Authenticated user is not an administrator (`role` must be `ADMIN`).',
  schema: {
    example: {
      statusCode: 403,
      message: 'Admin access required',
    },
  },
})
export class AdminGatewayController {
  constructor(private readonly adminService: AdminGatewayService) { }

  @Get('users')
  @ApiOperation({
    summary: 'List users',
    description:
      'Returns paginated users from the admin service with optional filters. Each user includes `lastSeenAt` and `isOnline` (true when last activity was within 2 minutes). Role query accepts short or DB forms, e.g. `STUDENT_USER`, `INSTRUCTOR_USER`.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: '1-based page index',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Page size (max sensible value enforced downstream)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    example: 'INSTRUCTOR_USER',
    description:
      'Filter by role: `STUDENT_USER`, `INSTRUCTOR_USER`, or `ADMIN`',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'lena@',
    description: 'Case-insensitive match on name, email, or bio',
  })
  @ApiResponse({
    status: 200,
    description: 'Wrapped user list and pagination metadata',
    schema: {
      example: {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: [
            {
              _id: '507f1f77bcf86cd799439011',
              name: 'Lena Ortiz',
              email: 'lena@example.com',
              role: 'INSTRUCTOR_USER',
              lastSeenAt: '2026-04-18T12:01:00.000Z',
              isOnline: true,
              createdAt: '2026-01-10T08:00:00.000Z',
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 142,
            pages: 8,
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get user by id',
    description:
      'Fetches a single user document from the admin service by MongoDB ObjectId.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'User document',
    schema: {
      example: {
        success: true,
        message: 'User retrieved successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Lena Ortiz',
          email: 'lena@example.com',
          role: 'STUDENT_USER',
          isActive: true,
          isVerified: true,
          createdAt: '2026-01-10T08:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('userId') userId: string) {
    return firstValueFrom(this.adminService.getUserById(userId));
  }

  @Patch('users/status')
  @ApiOperation({
    summary: 'Update user active status',
    description:
      'Updates `isActive` for the given `userId` via the admin microservice. Use to suspend or restore accounts.',
  })
  @ApiBody({ type: UpdateAdminUserStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Update accepted (exact payload depends on admin service)',
    schema: {
      example: {
        success: true,
        message: 'User status updated successfully',
        data: { updated: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid body or business rule failure',
  })
  updateUserStatus(@Body() dto: UpdateAdminUserStatusDto) {
    return firstValueFrom(this.adminService.updateUserStatus(dto));
  }

  @Patch('support/:id/reply')
  @ApiOperation({
    summary: 'Reply to dashboard support ticket',
    description:
      'Saves `adminReply` on the ticket identified by `id`, sets status to `REPLIED`, and attributes the action to the current admin user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Support ticket MongoDB ObjectId',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiBody({ type: ReplyAdminSupportDto })
  @ApiResponse({
    status: 200,
    description: 'Ticket updated',
    schema: {
      example: {
        success: true,
        message: 'Reply saved',
        data: {
          _id: '507f1f77bcf86cd799439012',
          status: 'REPLIED',
          adminReply: 'Thanks — we shipped a fix in build 440.',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is not a valid admin in admin DB',
  })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  replySupport(
    @Param('id') id: string,
    @Body() dto: ReplyAdminSupportDto,
    @Req() req: { user: { _id: string } },
  ) {
    return firstValueFrom(
      this.adminService.replyDashboardSupport({
        adminUserId: req.user._id,
        ticketId: id,
        adminReply: dto.adminReply,
      }),
    );
  }

  @Patch('support/:id/status')
  @ApiOperation({
    summary: 'Update support ticket status',
    description:
      'Updates support ticket status (`open`, `in-progress`, `resolved`, `closed`) and attributes the action to the current admin user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Support ticket MongoDB ObjectId',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiBody({ type: UpdateAdminSupportStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated',
  })
  updateSupportStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminSupportStatusDto,
    @Req() req: { user: { _id: string } },
  ) {
    return firstValueFrom(
      this.adminService.updateDashboardSupportStatus({
        adminUserId: req.user._id,
        ticketId: id,
        status: dto.status,
      }),
    );
  }

  @Get('notifications')
  @ApiOperation({
    summary: 'List admin notifications',
    description:
      'Paginated feed of dashboard notifications (e.g. `NEW_SUPPORT`, `INSTRUCTOR_APPLICATION`). Sorted newest first.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications page',
    schema: {
      example: {
        success: true,
        message: 'Notifications retrieved',
        data: {
          items: [
            {
              _id: '507f1f77bcf86cd799439014',
              type: 'INSTRUCTOR_APPLICATION',
              userId: '507f1f77bcf86cd799439011',
              message: 'New instructor application submitted',
              isRead: false,
              createdAt: '2026-04-18T11:00:00.000Z',
            },
            {
              _id: '507f1f77bcf86cd799439015',
              type: 'NEW_SUPPORT',
              userId: '507f1f77bcf86cd799439013',
              message: 'New BUG report: Export fails…',
              isRead: true,
              createdAt: '2026-04-17T09:30:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 50, total: 2, pages: 1 },
        },
      },
    },
  })
  getNotifications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.adminService.getAdminNotifications({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }),
    );
  }

  @Get('instructors/pending')
  @ApiOperation({
    summary: 'List pending instructor applications',
    description:
      'Returns instructors in the **app** auth database with `status: PENDING` and completed onboarding. Each item includes a `user` summary, full `onboarding` object (with `instructor` fields), and `cvUrl` for CV review.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending applications',
    schema: {
      example: {
        message: 'Pending instructors retrieved',
        data: {
          instructors: [
            {
              user: {
                _id: '507f1f77bcf86cd799439011',
                name: 'Sam Rivera',
                email: 'sam@example.com',
                profilePictureUrl: null,
                role: 'INSTRUCTOR_USER',
                status: 'PENDING',
                onboardingCompleted: true,
                isVerified: true,
                isActive: true,
                createdAt: '2026-03-01T10:00:00.000Z',
                updatedAt: '2026-04-18T09:00:00.000Z',
              },
              onboarding: {
                instructor: {
                  track: 'Web development',
                  experienceYears: 5,
                  bio: 'Former bootcamp lead instructor.',
                  teachingStyle: 'Project-based',
                  motivation: 'Help career switchers.',
                },
              },
              cvUrl:
                'https://bucket.s3.region.amazonaws.com/cvs/507f1f77bcf86cd799439011/cv.pdf',
            },
          ],
        },
      },
    },
  })
  listPendingInstructors() {
    return firstValueFrom(this.adminService.listPendingInstructors());
  }

  @Get('dashboard/overview')
  @ApiOperation({
    summary: 'Get admin dashboard overview',
    description:
      'Returns aggregated overview, performance, resource usage, system health, and recent activity data for the admin dashboard.',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    example: '24h',
    description: 'One of `24h`, `7d`, `30d`, `custom`',
  })
  @ApiQuery({
    name: 'customDate',
    required: false,
    example: '2026-04-24T00:00:00.000Z',
    description: 'Used when range=`custom`',
  })
  getDashboardOverview(
    @Query('range') range?: '24h' | '7d' | '30d' | 'custom',
    @Query('customDate') customDate?: string,
  ) {
    return firstValueFrom(
      this.adminService.getDashboardOverview({
        range,
        customDate,
      }),
    );
  }

  @Get('logging-monitoring')
  @ApiOperation({
    summary: 'Get logging and monitoring dashboard data',
    description:
      'Returns summary cards, logs list, sources, metrics series, and active alerts for the admin logging-monitoring page.',
  })
  getLoggingMonitoring(
    @Query('range')
    range?: '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | 'custom',
    @Query('customDate') customDate?: string,
    @Query('search') search?: string,
    @Query('levels') levels?: string,
    @Query('sources') sources?: string,
    @Query('limit') limit?: string,
  ): Observable<unknown> {
    // Check if admin logs are disabled
    if (process.env.HIDE_ADMIN_LOGS === 'true') {
      return new Observable((subscriber) => {
        subscriber.next({
          success: true,
          message: 'Admin logs are disabled',
          data: {
            summary: {
              totalLogs: 0,
              errors: 0,
              avgResponseMs: null,
              activeUsers: 0,
            },
            logs: [],
            sources: [],
            metrics: {
              responseTime: [],
              errorRate: [],
              requestVolume: [],
              requestDistribution: [
                { id: '2xx', label: '2xx', value: 0 },
                { id: '3xx', label: '3xx', value: 0 },
                { id: '4xx', label: '4xx', value: 0 },
                { id: '5xx', label: '5xx', value: 0 },
              ],
            },
            alerts: [],
          },
        });
        subscriber.complete();
      });
    }

    const parsedLevels = levels
      ? (levels.split(',').filter(Boolean) as Array<
        'error' | 'warning' | 'info' | 'debug' | 'trace'
      >)
      : undefined;
    const parsedSources = sources
      ? sources.split(',').filter(Boolean)
      : undefined;
    const parsedLimit = limit ? Number(limit) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.adminService.getLoggingMonitoring({
      range,
      customDate,
      search,
      levels: parsedLevels,
      sources: parsedSources,
      limit: parsedLimit,
    }) as Observable<unknown>;
  }

  @Get('performance-metrics')
  @ApiOperation({
    summary: 'Get performance metrics dashboard data',
    description:
      'Returns overview, server, database, and API performance sections for the admin performance metrics page.',
  })
  getPerformanceMetrics(
    @Query('range') range?: '24h' | '7d' | '30d' | 'custom',
    @Query('customDate') customDate?: string,
  ): Observable<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.adminService.getPerformanceMetrics({
      range,
      customDate,
    }) as Observable<unknown>;
  }

  @Get('user-management/overview')
  @ApiOperation({
    summary: 'Get user management overview',
    description:
      'Returns user activity chart, role distribution, timeline, and quick stats for the User Management overview tab.',
  })
  getUserManagementOverview(): Observable<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.adminService.getUserManagementOverview() as Observable<unknown>;
  }

  @Get('support/tickets')
  @ApiOperation({
    summary: 'Get support tickets for admin management',
    description: 'Returns paginated support tickets with search and status filters.',
  })
  getSupportTickets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'OPEN' | 'REPLIED',
    @Query('search') search?: string,
  ): Observable<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.adminService.getSupportTickets({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      search,
    }) as Observable<unknown>;
  }

  @Get('support/analytics')
  @ApiOperation({
    summary: 'Get support analytics for admin dashboard',
    description: 'Returns support KPIs and chart series.',
  })
  getSupportAnalytics(): Observable<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.adminService.getSupportAnalytics() as Observable<unknown>;
  }

  @Get('security-logs')
  @ApiOperation({
    summary: 'Get security center data',
    description:
      'Returns security logs, alert feed, and security metrics for the Security Center page.',
  })
  getSecurityLogs(
    @Query('range') range?: '24h' | '7d' | '30d' | 'custom',
    @Query('customDate') customDate?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Observable<unknown> {
    return this.adminService.getSecurityLogs({
      range,
      customDate,
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch('instructors/:id/approve')
  @ApiOperation({
    summary: 'Approve pending instructor',
    description:
      'Sets the instructor’s **app** account `status` from `PENDING` to `ACTIVE` after CV review. Only users with role `INSTRUCTOR_USER` currently in `PENDING` are accepted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Instructor user id (Mongo ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor approved',
    schema: {
      example: {
        message: 'Instructor approved successfully',
        data: {
          userId: '507f1f77bcf86cd799439011',
          status: 'ACTIVE',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Not an instructor or not in PENDING state',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  approveInstructor(@Param('id') id: string) {
    return firstValueFrom(this.adminService.approveInstructor(id));
  }

  @Patch('instructors/:id/reject')
  @ApiOperation({
    summary: 'Reject pending instructor application',
    description:
      'Sets **app** account `status` to `REJECTED`. Rejected instructors cannot complete password/OAuth login or refresh tokens until your product allows re-application.',
  })
  @ApiParam({
    name: 'id',
    description: 'Instructor user id (Mongo ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Application rejected',
    schema: {
      example: {
        message: 'Instructor application rejected',
        data: {
          userId: '507f1f77bcf86cd799439011',
          status: 'REJECTED',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Not an instructor or not in PENDING state',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  rejectInstructor(@Param('id') id: string) {
    return firstValueFrom(this.adminService.rejectInstructor(id));
  }

  @Get('settings')
  getAdminSettings(@Req() req: { user: { _id: string } }): Observable<unknown> {
    return this.adminService.getAdminSettings(req.user._id);
  }

  @Patch('settings')
  updateAdminSettings(
    @Req() req: { user: { _id: string } },
    @Body()
    body: {
      font?: string;
      fontSize?: string;
      theme?: 'light' | 'dark';
      language?: string;
    },
  ): Observable<unknown> {
    return this.adminService.updateAdminSettings(req.user._id, body ?? {});
  }

  @Post('settings/reset')
  resetAdminSettings(
    @Req() req: { user: { _id: string } },
  ): Observable<unknown> {
    return this.adminService.resetAdminSettings(req.user._id);
  }

  @Get('settings/notifications')
  getAdminNotificationSettings(
    @Req() req: { user: { _id: string } },
  ): Observable<unknown> {
    return this.adminService.getAdminNotificationSettings(req.user._id);
  }

  @Patch('settings/notifications')
  updateAdminNotificationSettings(
    @Req() req: { user: { _id: string } },
    @Body()
    body: {
      notifyMe?: 'all' | 'mentions' | 'none';
      communicationEmails?: boolean;
      marketingEmails?: boolean;
      socialEmails?: boolean;
      securityEmails?: boolean;
    },
  ): Observable<unknown> {
    return this.adminService.updateAdminNotificationSettings(
      req.user._id,
      body ?? {},
    );
  }

  @Post('settings/notifications/reset')
  resetAdminNotificationSettings(
    @Req() req: { user: { _id: string } },
  ): Observable<unknown> {
    return this.adminService.resetAdminNotificationSettings(req.user._id);
  }

  @Get('settings/account')
  getAdminAccount(@Req() req: { user: { _id: string } }): Observable<unknown> {
    return this.adminService.getAdminAccount(req.user._id);
  }

  @Patch('settings/account')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: ADMIN_ACCOUNT_AVATAR_MAX_BYTES } }),
  )
  updateAdminAccount(
    @Req() req: { user: { _id: string } },
    @Body() body: Record<string, unknown>,
    @UploadedFile() file?: Express.Multer.File,
  ): Observable<unknown> {
    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      throw new BadRequestException(
        'Email cannot be updated from this endpoint',
      );
    }
    return this.adminService.updateAdminAccount(req.user._id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      bio: typeof body.bio === 'string' ? body.bio : undefined,
      address: typeof body.address === 'string' ? body.address : undefined,
      dateOfBirth:
        typeof body.dateOfBirth === 'string' ? body.dateOfBirth : undefined,
      file,
    });
  }
}
