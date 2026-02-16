import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBasicAuth,
  ApiBody,
  ApiCookieAuth,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Env } from '../../config/env.config';
import { ProviderEnum } from '../../enums/account-provider.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { WelcomeUserDto } from './dto/welcome-user.dto';
import { RequestResetPasswordDto, VerifyResetCodeDto, ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateRoleChangeDto } from './dto/validate-role-change.dto';
import { UnauthorizedException } from '../../utils/appError';
import { InternalSecretGuard } from '../../common/guards/internal-secret.guard';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.registerUser(registerDto);

    res.cookie('vonova_auth', '1', {
      httpOnly: false,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1,
      path: '/',
    });

    return res.status(201).json({
      message: result.message,
    });
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with code' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmailCode(verifyEmailDto.email, verifyEmailDto.code);
    return {
      message: 'Email verified successfully',
    };
  }

  @Post('welcome-email-user')
  @ApiOperation({ summary: 'Welcome email user and set role' })
  @ApiResponse({ status: 200, description: 'Role set and user welcomed successfully' })
  async welcomeUserEmail(
    @Body() welcomeDto: WelcomeUserDto,
    @Headers('user-agent') userAgent: string,
    @Res() res: Response,
  ) {
    const result = await this.authService.welcomeUserEmail({
      ...welcomeDto,
      userAgent: userAgent || 'unknown',
    });

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1,
      path: '/',
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });

    return res.status(200).json({
      message: 'Role set and user welcomed successfully',
      data: {
        userId: result.userId,
        userRole: result.userRole,
      },
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  async login(
    @Body() loginDto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Res() res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.loginUserEmail({
      ...loginDto,
      userAgent: userAgent || 'unknown',
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });

    return res.status(200).json({
      message: 'User logged in successfully',
      data: {
        user,
      },
    });
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Passport handles the redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as any;
    if (!googleUser) {
      return res.redirect(`${Env.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`);
    }

    const { user, isNewUser, providerId, accessToken, refreshToken } =
      await this.authService.oAuthGoogleLogin({
        provider: ProviderEnum.GOOGLE,
        displayName: googleUser.name || googleUser.displayName,
        providerId: googleUser.providerId || googleUser._id || googleUser.id,
        picture: googleUser.profilePicture || googleUser.picture,
        email: googleUser.email,
        userAgent: req.headers['user-agent'] || 'unknown',
      });

    if (isNewUser || user.role === 'PENDING') {
      res.cookie('providerId', providerId, {
        httpOnly: true,
        secure: true,
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      return res.redirect(`${Env.FRONTEND_GOOGLE_CALLBACK_URL}?welcome=true`);
    } else if (user.role === 'INSTRUCTORS_USER') {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      return res.redirect(`${Env.FRONTEND_ORIGIN}/instructors/dashboard`);
    } else if (user.role === 'STUDENT_USER') {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      return res.redirect(`${Env.FRONTEND_ORIGIN}/students/dashboard`);
    } else {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      return res.redirect(`${Env.FRONTEND_ORIGIN}/shopper/dashboard`);
    }
  }

  @Post('welcome-oauth-google')
  @ApiOperation({ summary: 'Welcome OAuth Google user and set role' })
  @ApiResponse({ status: 200, description: 'Role set and user welcomed successfully' })
  async welcomeUseroAuthGoogle(
    @Body() welcomeDto: WelcomeUserDto,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const providerId = req.cookies?.providerId;
    const result = await this.authService.welcomeUseroAuthGoogle({
      providerId,
      userAgent: userAgent || 'unknown',
      role: welcomeDto.role,
      answerOne: welcomeDto.answerOne,
    });

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1,
      path: '/',
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });

    res.clearCookie('providerId');

    return res.status(200).json({
      message: 'Role set and user welcomed successfully',
      data: {
        userId: result.userId,
        userRole: result.userRole,
      },
    });
  }

  @Get('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Refreshed token successfully' })
  async refreshToken(
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const refresh_token = req.cookies?.refreshToken;
    if (!refresh_token) {
      throw new UnauthorizedException('Missing or invalid refresh token');
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken(
      refresh_token,
      userAgent || 'unknown',
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });

    return res.status(200).json({
      message: 'Refreshed token successfully',
    });
  }

  @Post('request-resetPass')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset code sent successfully' })
  async requestResetPassword(@Body() dto: RequestResetPasswordDto) {
    const result = await this.authService.requestResetPassword(dto.email);
    return {
      message: result.message,
    };
  }

  @Post('verify-resetPass-code')
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({ status: 200, description: 'Reset code verified successfully' })
  async verifyResetPassCode(@Body() dto: VerifyResetCodeDto, @Res() res: Response) {
    const result = await this.authService.verifyResetPasswordCode(dto.email, dto.code);

    res.cookie('resetToken', result.resetToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 10,
      path: '/',
    });

    return res.status(200).json({
      message: result.message,
    });
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const resetToken = req.cookies?.resetToken;
    if (!resetToken) {
      throw new UnauthorizedException('Missing or invalid reset token');
    }
    const result = await this.authService.resetPassword(resetToken, dto.newPassword);
    return {
      message: result.message,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing or invalid refresh token');
    }

    const result = await this.authService.logout(refreshToken, userAgent || 'unknown');

    const cookieOpts = {
      path: '/',
      secure: Env.NODE_ENV === 'production',
      sameSite: (Env.NODE_ENV === 'production' ? 'none' : 'lax') as 'lax' | 'strict' | 'none',
    } as const;
    res.clearCookie('accessToken', cookieOpts);
    res.clearCookie('refreshToken', cookieOpts);
    res.clearCookie('vonova_auth', { path: '/', secure: cookieOpts.secure, sameSite: cookieOpts.sameSite });

    return res.status(200).json({
      message: result.message,
    });
  }

  @Post('logout-all')
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices successfully' })
  async logoutAllDevices(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing or invalid refresh token');
    }

    const result = await this.authService.logoutAllDevices(refreshToken);

    const cookieOpts = {
      path: '/',
      secure: Env.NODE_ENV === 'production',
      sameSite: (Env.NODE_ENV === 'production' ? 'none' : 'lax') as 'lax' | 'strict' | 'none',
    } as const;
    res.clearCookie('accessToken', cookieOpts);
    res.clearCookie('refreshToken', cookieOpts);

    return res.status(200).json({
      message: result.message,
    });
  }

  @Get('currentUser')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user fetched successfully' })
  async getCurrentUser(@Req() req: Request) {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('Missing or invalid access token');
    }

    const user = await this.authService.getCurrentUser(accessToken);

    return {
      message: 'Current user fetched successfully',
      user: user.user,
    };
  }

  @Post('validate-role-change')
  @ApiOperation({ summary: 'Validate role change' })
  @ApiResponse({ status: 200, description: 'Role change validated successfully' })
  async validateRoleChange(@Body() dto: ValidateRoleChangeDto) {
    const result = await this.authService.validateRoleChange(dto);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Post('verify-and-permissions')
  @UseGuards(InternalSecretGuard)
  @ApiOperation({ summary: 'Verify token and get permissions (internal)' })
  @ApiResponse({ status: 200, description: 'Token verification successful' })
  @ApiBasicAuth()
  async verifyAndPermissions(@Req() req: Request) {
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Missing or invalid access token');
    }

    const result = await this.authService.verifyAndPermissions(accessToken);

    return {
      message: 'Token verification successful',
      data: result,
    };
  }

  @Get('instructors')
  @ApiOperation({
    summary: 'Get all instructors',
    description: 'Returns a list of all users with the INSTRUCTORS_USER role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructors fetched successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Instructors fetched successfully',
        },
        data: {
          type: 'object',
          properties: {
            instructors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string', example: 'INSTRUCTORS_USER' },
                  isVerified: { type: 'boolean' },
                  isActive: { type: 'boolean' },
                  profilePicture: { type: 'string', nullable: true },
                  lastLogin: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                  },
                },
              },
            },
            count: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  async getInstructors() {
    const result = await this.authService.getInstructors();
    return {
      message: 'Instructors fetched successfully',
      data: result,
    };
  }

  @Get('students')
  @ApiOperation({
    summary: 'Get all students',
    description: 'Returns a list of all users with the STUDENT_USER role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Students fetched successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Students fetched successfully' },
        data: {
          type: 'object',
          properties: {
            students: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string', example: 'STUDENT_USER' },
                  isVerified: { type: 'boolean' },
                  isActive: { type: 'boolean' },
                  profilePicture: { type: 'string', nullable: true },
                  lastLogin: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                  },
                },
              },
            },
            count: { type: 'number', example: 25 },
          },
        },
      },
    },
  })
  async getStudents() {
    const result = await this.authService.getStudents();
    return {
      message: 'Students fetched successfully',
      data: result,
    };
  }

  @Get('instructor-requests')
  @ApiOperation({
    summary: 'Get all pending instructor requests',
    description:
      'Returns a list of all users who applied as instructors and are pending approval.',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor requests fetched successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Instructor requests fetched successfully',
        },
        data: {
          type: 'object',
          properties: {
            requests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string', example: 'PENDING' },
                  pendingInstructor: { type: 'boolean', example: true },
                  onboardingAnswers: { type: 'object' },
                  isVerified: { type: 'boolean' },
                  isActive: { type: 'boolean' },
                  profilePicture: { type: 'string', nullable: true },
                  lastLogin: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                  },
                },
              },
            },
            count: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  async getInstructorRequests() {
    const result = await this.authService.getInstructorRequests();
    return {
      message: 'Instructor requests fetched successfully',
      data: result,
    };
  }

  @Post('instructor-requests/approve')
  @ApiOperation({
    summary: 'Approve instructor request',
    description:
      'Owner-only endpoint to approve a pending instructor request and set role to INSTRUCTORS_USER.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        ownerUserId: { type: 'string', example: '507f1f77bcf86cd799439012' },
      },
      required: ['userId', 'ownerUserId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor approved successfully',
  })
  async approveInstructor(
    @Body() body: { userId: string; ownerUserId: string },
  ) {
    const result = await this.authService.approveInstructor(body);
    return {
      message: result.message,
      data: {
        user: result.user,
      },
    };
  }

  @Post('instructor-requests/reject')
  @ApiOperation({
    summary: 'Reject instructor request',
    description:
      'Owner-only endpoint to reject a pending instructor request. The applicant user is deleted from the database.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        ownerUserId: { type: 'string', example: '507f1f77bcf86cd799439012' },
      },
      required: ['userId', 'ownerUserId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor request rejected successfully',
  })
  async rejectInstructor(
    @Body() body: { userId: string; ownerUserId: string },
  ) {
    const result = await this.authService.rejectInstructor(body);
    return {
      message: result.message,
      data: {
        userId: result.userId,
      },
    };
  }
}

