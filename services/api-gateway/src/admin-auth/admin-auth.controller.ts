/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Request,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RequestLoginCodeDto } from './dto/request-login-code.dto';
import { VerifyLoginDto } from './dto/verify-login.dto';
import { AdminResetPasswordDto } from './dto/reset-password.dto';
import { AdminRefreshTokenDto } from './dto/refresh-token.dto';
import { AdminLogoutDto } from './dto/logout.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { extractAccessTokenFromRequest } from '../common/utils/extract-access-token';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';

type AdminJwtUser = { _id?: string; adminId?: string; userId?: string };

@ApiTags('Admin')
@Controller('api/v1/admin/auth')
export class AdminAuthGatewayController {
  constructor(
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  /**
   * Step 1: Request OTP login code
   * Validates admin credentials and sends a 6-digit OTP to admin email
   *
   * Flow: API Gateway → NATS → App Service
   * - Validates admin credentials against database
   * - Generates 6-digit OTP (10-minute expiry)
   * - Sends OTP to configured admin email
   * - Enforces rate limiting (3 requests per 5 minutes)
   */
  @Post('request-login-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request admin login OTP',
    description:
      'Validates admin credentials and sends a 6-digit OTP code to admin email for two-factor authentication.',
  })
  @ApiBody({
    type: RequestLoginCodeDto,
    description: 'Admin credentials for OTP request',
    examples: {
      validAdmin: {
        summary: 'Valid admin credentials',
        value: {
          email: 'admin@vonova.com',
          password: 'SecurePass123!@#',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      example: {
        message: 'OTP sent to vonovacompany@gmail.com',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Email not authorized as admin',
    schema: {
      example: {
        statusCode: 403,
        message: 'Access denied. This email is not authorized as an admin.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
    schema: {
      example: {
        statusCode: 429,
        message: 'Too many OTP requests. Please try again in 2 minute(s)',
        error: 'Too Many Requests',
      },
    },
  })
  async requestLoginCode(
    @Body() dto: RequestLoginCodeDto,
  ): Promise<{ message: string }> {
    return firstValueFrom(
      this.natsClient.send('admin.auth.request-login-code', dto),
    );
  }

  /**
   * Step 2: Verify OTP and get JWT token
   * Validates the 6-digit OTP and returns a JWT access token
   *
   * Flow: API Gateway → NATS → App Service
   * - Validates OTP code and expiry (10 minutes)
   * - Checks failed attempts (max 5 attempts)
   * - Marks OTP as used after successful verification
   * - Generates JWT token with admin role
   */
  @Post('verify-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP and get JWT token',
    description:
      'Validates the 6-digit OTP code and returns a JWT access token for authenticated admin access.',
  })
  @ApiBody({
    type: VerifyLoginDto,
    description: 'OTP verification details',
    examples: {
      validOtp: {
        summary: 'Valid OTP code',
        value: {
          email: 'admin@vonova.com',
          code: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NzBhYmNkZWYiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2OTI1NDQ4MDAsImV4cCI6MTY5MjU0ODQwMH0.signature',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired OTP',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid or expired OTP',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'OTP already used',
    schema: {
      example: {
        statusCode: 401,
        message: 'OTP has already been used',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Too many failed attempts',
    schema: {
      example: {
        statusCode: 401,
        message: 'Too many failed attempts. Please request a new OTP.',
        error: 'Unauthorized',
      },
    },
  })
  async verifyLogin(
    @Body() dto: VerifyLoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return firstValueFrom(this.natsClient.send('admin.auth.verify-login', dto));
  }

  /**
   * Step 3: Reset password
   * Allows authenticated admin to change their password
   *
   * Flow: API Gateway → NATS → App Service
   * - Requires valid JWT token in Authorization header
   * - Validates old password against current hash
   * - Enforces strong password requirements
   * - Hashes new password with bcrypt
   * - Clears temporary password flag if set
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reset admin password',
    description:
      'Allows authenticated admin to change their password. Requires valid JWT token and current password verification.',
  })
  @ApiBody({
    type: AdminResetPasswordDto,
    description: 'Password reset details',
    examples: {
      validReset: {
        summary: 'Valid password reset',
        value: {
          oldPassword: 'OldSecurePass123!@#',
          newPassword: 'NewSecurePass456!@#',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      example: {
        message: 'Password updated successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid old password',
    schema: {
      example: {
        statusCode: 400,
        message: 'Old password is incorrect',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'New password same as old',
    schema: {
      example: {
        statusCode: 400,
        message: 'New password must be different from the old password',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Weak new password',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @UseGuards(AdminJwtAuthGuard)
  async resetPassword(
    @Request() req: { user?: AdminJwtUser },
    @Body() dto: AdminResetPasswordDto,
  ): Promise<{ message: string }> {
    const u = req.user;
    const adminId = u?._id ?? u?.adminId ?? u?.userId;

    return firstValueFrom(
      this.natsClient.send('admin.auth.reset-password', {
        adminId,
        ...dto,
      }),
    );
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh admin tokens',
    description: 'Rotates admin refresh token and issues a fresh access token.',
  })
  @ApiBody({ type: AdminRefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      },
    },
  })
  async refreshToken(
    @Body() dto: AdminRefreshTokenDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return firstValueFrom(
      this.natsClient.send('admin.auth.refresh-token', dto),
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout admin',
    description: 'Revokes the provided admin refresh token.',
  })
  @ApiBody({ type: AdminLogoutDto })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: { example: { message: 'Logged out successfully' } },
  })
  async logout(@Body() dto: AdminLogoutDto): Promise<{ message: string }> {
    return firstValueFrom(this.natsClient.send('admin.auth.logout', dto));
  }

  @Get('current-user')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated admin',
    description:
      'Returns current admin profile from access token sent in Authorization header or accessToken cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current admin fetched successfully',
    schema: {
      example: {
        message: 'Current admin fetched successfully',
        user: {
          _id: '507f1f77bcf86cd799439011',
          email: 'admin@vonova.com',
          role: 'admin',
        },
      },
    },
  })
  async currentUser(@Request() req: any): Promise<{
    message: string;
    user: { _id: string; email: string; role: string };
  }> {
    const accessToken = extractAccessTokenFromRequest(req);
    if (!accessToken) {
      throw new BadRequestException(
        'Access token required: set accessToken cookie or Authorization: Bearer <jwt>',
      );
    }
    return firstValueFrom(
      this.natsClient.send('admin.auth.current-user', accessToken),
    );
  }
}
