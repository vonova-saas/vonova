/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Res,
  BadRequestException,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiHeader,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthGatewayService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { WelcomeEmailDto } from './dto/welcome-email.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CheckCouponDto } from './dto/check-coupon.dto';
import { UploadProfilePictureDto } from './dto/upload-profile-picture.dto';
import { OAuthGoogleLoginDto } from './dto/oauth-google-login.dto';
import { OAuthWelcomeDto } from './dto/oauth-welcome.dto';
import configuration from '../../common/config/configuration';
import { firstValueFrom } from 'rxjs';
import type { UploadedFile as CustomUploadedFile } from '../../common/interfaces/file.interface';

@ApiTags('Authentication')
@ApiCookieAuth()
@Controller('api/v1/auth')
export class AuthGatewayController {
  constructor(private readonly authService: AuthGatewayService) { }

  // Register Flow
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with email verification required.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User registered successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'john.doe@example.com' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists',
  })
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent = 'unknown',
  ) {
    return this.authService.register(dto, userAgent);
  }

  @ApiOperation({
    summary: 'Verify user email',
    description: 'Verifies user email using the verification code sent to their email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email verified successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'john.doe@example.com' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid verification code',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @ApiOperation({
    summary: 'Complete user welcome process',
    description:
      'Completes the user welcome process after email verification and sets authentication cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome process completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User welcomed successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userRole: { type: 'string', example: 'STUDENT' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Post('welcome-email-user')
  async welcomeEmail(
    @Body() dto: Omit<WelcomeEmailDto, 'userAgent'>,
    @Headers('user-agent') userAgent = 'unknown',
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await firstValueFrom(
      this.authService.welcomeEmail(dto, userAgent),
    );

    // Set refresh token in HTTP-only cookie
    response.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set access token in HTTP-only cookie
    response.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
      path: '/',
    });

    // Return response without tokens in body
    return {
      message: result.message,
      data: {
        userId: result.data.userId,
        userRole: result.data.userRole,
      },
    };
  }

  @ApiOperation({
    summary: 'Upload profile picture',
    description: 'Uploads a profile picture for the user. Requires multipart/form-data with file field.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile picture upload data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture image file',
        },
        userId: {
          type: 'string',
          description: 'User ID',
          example: '507f1f77bcf86cd799439011',
        },
      },
      required: ['file', 'userId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Profile picture uploaded successfully',
        },
        data: {
          type: 'object',
          properties: {
            profilePictureUrl: {
              type: 'string',
              example: 'https://example.com/profile-pictures/user123.jpg',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - File or user ID missing',
  })
  @Post('upload-profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePicture(
    @Body() dto: UploadProfilePictureDto,
    @UploadedFile() file: CustomUploadedFile,
  ) {
    if (!file) {
      throw new BadRequestException('Profile picture file is required');
    }
    return this.authService.uploadProfilePicture({ ...dto, file });
  }

  @ApiOperation({
    summary: 'Validate coupon code',
    description: 'Validates a coupon code for a specific user and email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Coupon validated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Coupon is valid' },
        data: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean', example: true },
            discount: { type: 'number', example: 20 },
            discountType: { type: 'string', example: 'percentage' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid coupon code',
  })
  @Post('check-coupon-code')
  checkCouponCode(@Body() dto: CheckCouponDto) {
    return this.authService.checkCouponCode(dto);
  }

  // Login
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user credentials and sets authentication cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login successful' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                email: { type: 'string', example: 'john.doe@example.com' },
                name: { type: 'string', example: 'John Doe' },
                role: { type: 'string', example: 'STUDENT' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent = 'unknown',
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await firstValueFrom(this.authService.login(dto, userAgent));

    // Set refresh token in HTTP-only cookie
    response.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set access token in HTTP-only cookie
    response.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
      path: '/',
    });

    // Return response without tokens in body
    return {
      message: result.message,
      data: {
        user: result.data.user,
      },
    };
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refreshes access token using refresh token from cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Tokens refreshed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Refresh token cookie required',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid refresh token',
  })
  @Post('refresh-token')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token cookie is required');
    }

    const result = await firstValueFrom(
      this.authService.refreshToken(refreshToken),
    );

    // Set new refresh token in HTTP-only cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set new access token in HTTP-only cookie
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
      path: '/',
    });

    return {
      message: 'Tokens refreshed successfully',
    };
  }

  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieves current user information using access token from cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        email: { type: 'string', example: 'john.doe@example.com' },
        name: { type: 'string', example: 'John Doe' },
        role: { type: 'string', example: 'STUDENT' },
        avatarUrl: {
          type: 'string',
          example: 'https://example.com/avatar.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Access token cookie required',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid access token',
  })
  @Get('current-user')
  currentUser(@Req() request: Request) {
    const accessToken = request.cookies?.accessToken;
    if (!accessToken) {
      throw new BadRequestException('Access token cookie is required');
    }
    return this.authService.currentUser(accessToken);
  }

  @ApiOperation({
    summary: 'Request password reset',
    description: "Sends a password reset code to the user's email address.",
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset code sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password reset code sent to your email',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Post('request-reset-password')
  requestResetPassword(@Body() dto: RequestResetPasswordDto) {
    return this.authService.requestResetPassword(dto);
  }

  @ApiOperation({
    summary: 'Verify password reset code',
    description: 'Verifies the password reset code and sets a reset token cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset code verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Reset code verified successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid reset code',
  })
  @Post('verify-reset-code')
  async verifyResetCode(
    @Body() dto: VerifyResetCodeDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await firstValueFrom(this.authService.verifyResetCode(dto));

    // Set reset token in HTTP-only cookie
    response.cookie('resetToken', result.resetToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 10, // 10 minutes
      path: '/',
    });

    return {
      message: result.message,
    };
  }

  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using the reset token from cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid reset token or new password',
  })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    const resetToken = request.cookies?.resetToken;
    if (!resetToken) {
      throw new BadRequestException('Reset token cookie is required');
    }
    return this.authService.resetPassword({ ...dto, resetToken });
  }

  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out user and clears authentication cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout successful' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Refresh token cookie required',
  })
  @Post('logout')
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token cookie is required');
    }

    // Clear the refresh token cookie
    response.clearCookie('refreshToken', { path: '/' });
    response.clearCookie('accessToken', { path: '/' });

    return this.authService.logout(refreshToken);
  }

  // OAuth Endpoints
  @ApiOperation({
    summary: 'OAuth Google login',
    description: 'Authenticates user via Google OAuth and sets authentication cookies or redirects to welcome flow.',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth login successful',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'OAuth login successful' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    email: { type: 'string', example: 'john.doe@gmail.com' },
                    name: { type: 'string', example: 'John Doe' },
                    role: { type: 'string', example: 'STUDENT' },
                  },
                },
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              },
            },
          },
        },
        {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'OAuth login successful, please complete welcome step' },
            data: {
              type: 'object',
              properties: {
                isNewUser: { type: 'boolean', example: true },
                user: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    email: { type: 'string', example: 'john.doe@gmail.com' },
                  },
                },
                providerId: { type: 'string', example: '1234567890' },
              },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid OAuth data',
  })
  @Post('oauth/google-login')
  async oAuthGoogleLogin(
    @Body() dto: OAuthGoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await firstValueFrom(this.authService.oAuthGoogleLogin(dto));

    // For new users, set providerId cookie and redirect to welcome
    if (result.isNewUser || result.user.role === 'PENDING') {
      response.cookie('providerId', result.providerId, {
        httpOnly: true,
        secure: configuration().NODE_ENV === 'production',
        sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60, // 1 hour
        path: '/',
      });

      return {
        message: 'OAuth login successful, please complete welcome step',
        data: {
          isNewUser: result.isNewUser,
          user: result.user,
          providerId: result.providerId,
        },
      };
    }

    // For existing users, set tokens and return user data
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
      path: '/',
    });

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return {
      message: 'OAuth login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    };
  }

  @ApiOperation({
    summary: 'Complete OAuth welcome process',
    description:
      'Completes the OAuth welcome process for Google users and sets authentication cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth welcome process completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Role set and user welcomed successfully',
        },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userRole: { type: 'string', example: 'STUDENT' },
            username: { type: 'string', example: 'johndoe123' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid OAuth data or missing provider ID',
  })
  @Post('oauth/welcome-google')
  async welcomeUserOAuthGoogle(
    @Body() dto: OAuthWelcomeDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const providerId = request.cookies?.providerId || dto.providerId;
    const userAgent = request.headers['user-agent'] || dto.userAgent;

    const result = await firstValueFrom(
      this.authService.welcomeUserOAuthGoogle({
        ...dto,
        providerId,
        userAgent,
      }),
    );

    // Set tokens as HTTP-only cookies
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
      path: '/',
    });

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: configuration().NODE_ENV === 'production',
      sameSite: configuration().NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Clear providerId cookie
    response.clearCookie('providerId', { path: '/' });

    return {
      message: 'Role set and user welcomed successfully',
      data: {
        userId: result.userId,
        userRole: result.userRole,
        username: result.username,
      },
    };
  }

  @ApiOperation({
    summary: 'Logout from all devices',
    description:
      'Logs out user from all devices and clears all authentication cookies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout from all devices successful',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logged out from all devices successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Access token cookie required',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid access token',
  })
  @Post('logout-all')
  logoutAll(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const accessToken = request.cookies?.accessToken;
    if (!accessToken) {
      throw new BadRequestException('Access token cookie is required');
    }

    // Extract userId from access token (you might need to decode it)
    // For now, let's assume the service can extract userId from the token
    // Or you could decode it here and pass userId directly

    // Clear all auth cookies
    response.clearCookie('refreshToken', { path: '/' });
    response.clearCookie('accessToken', { path: '/' });
    response.clearCookie('resetToken', { path: '/' });

    // The service should extract userId from the token
    return this.authService.logoutAll(accessToken);
  }
}
