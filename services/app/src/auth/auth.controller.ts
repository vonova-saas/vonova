import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UnauthorizedException, BadRequestException } from '../utils/appError';
import { Env } from '../config/env.config';
import { ProviderEnum } from '../enums/account-provider.enum';
import { AuthGuard } from '@nestjs/passport';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  WelcomeEmailDto,
  RequestResetPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
  ValidateRoleChangeDto,
  WelcomeOAuthGoogleDto,
} from './dto/auth.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { uploadCvToS3 } from '../utils/s3';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private hasTokens(
    result: unknown,
  ): result is { accessToken: string; refreshToken: string } {
    if (typeof result !== 'object' || result === null) return false;
    const r = result as Record<string, unknown>;
    return (
      typeof r.accessToken === 'string' && typeof r.refreshToken === 'string'
    );
  }

  private setCookie(
    res: Response,
    name: string,
    value: string,
    maxAge: number,
  ) {
    res.cookie(name, value, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge,
      path: '/',
    });
  }

  private clearCookie(res: Response, name: string) {
    const cookieOpts = {
      path: '/',
      secure: Env.NODE_ENV === 'production',
      sameSite: (Env.NODE_ENV === 'production' ? 'none' : 'lax') as
        | 'lax'
        | 'strict'
        | 'none',
    } as const;
    res.clearCookie(name, cookieOpts);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiTags('Auth', 'Registration')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with email and password. Sends a verification code to the provided email address.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'User registered successfully. Verification code sent to email.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'User registered successfully. Please check your email for verification code.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or user already exists',
  })
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.registerUser(registerDto);

    res.cookie('vonova_auth', '1', {
      httpOnly: false,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day
      path: '/',
    });

    return res.json({
      message: result.message,
    });
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Auth', 'Registration')
  @ApiOperation({
    summary: 'Verify email with code',
    description:
      'Verifies the user email address using the 6-digit code sent to their email.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email verified successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired verification code',
  })
  @ApiNotFoundResponse({ description: 'Verification code not found' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmailCode(
      verifyEmailDto.email,
      verifyEmailDto.otp_code,
    );
    return {
      message: 'Email verified successfully',
    };
  }

  @Post('welcome-email-user')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Auth', 'Registration')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Welcome email user and set role',
    description:
      'Sets the user role after email verification and issues authentication tokens. Sets access and refresh tokens as HTTP-only cookies. For INSTRUCTORS_USER role, CV file (PDF) is required. For STUDENT_USER role, CV is not needed.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'role', 'answerOne'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'Email address of the user',
          example: 'john@example.com',
        },
        role: {
          type: 'string',
          enum: ['STUDENT_USER', 'INSTRUCTORS_USER'],
          description: 'User role: STUDENT_USER or INSTRUCTORS_USER',
          example: 'STUDENT_USER',
        },
        answerOne: {
          type: 'string',
          description:
            'Answer 1: For STUDENT_USER - "What subjects are you most interested in?". For INSTRUCTORS_USER - "What subjects will you teach?"',
          example: 'Math, Physics, Web Development',
        },
        answerTwo: {
          type: 'string',
          description:
            'Answer 2: For STUDENT_USER - "What is your current level?". For INSTRUCTORS_USER - "How many years of teaching experience do you have?"',
          example: 'Beginner',
        },
        answerThree: {
          type: 'string',
          description:
            'Answer 3: For STUDENT_USER - "What is your primary learning goal for the next 3 months?". For INSTRUCTORS_USER - "What content format do you prefer?"',
          example: 'Pass a certification, Improve grades, Build a project',
        },
        answerFour: {
          type: 'string',
          description:
            'Answer 4: For STUDENT_USER - "How many hours per week can you study?". For INSTRUCTORS_USER - "What class size do you prefer?"',
          example: '3, 5, 10+',
        },
        answerFive: {
          type: 'string',
          description:
            'Answer 5: For STUDENT_USER - "Preferred learning style". For INSTRUCTORS_USER - "Your primary goal on Vonova"',
          example: 'Video lessons, Live sessions, Self-paced',
        },
        cv: {
          type: 'string',
          format: 'binary',
          description:
            'CV file upload (PDF only) - REQUIRED for INSTRUCTORS_USER role, NOT needed for STUDENT_USER role. Upload as multipart/form-data file field.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Role set and user welcomed successfully. Tokens set as cookies.',
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
            userRole: { type: 'string', example: 'STUDENT_USER' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid role, user not verified, or CV file missing for instructors',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async welcomeUserEmail(
    @UploadedFile() cv: Express.Multer.File | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Access form data directly from req.body (multer parses multipart/form-data)
    // Multer puts form fields in req.body as strings
    // Note: FileInterceptor should parse all form fields, not just the file
    const rawBody = req.body as Record<string, any>;

    // Normalize body keys (trim whitespace from field names - common issue with form-data)
    const body: Record<string, any> = {};
    for (const key in rawBody) {
      const normalizedKey = key.trim();
      body[normalizedKey] = rawBody[key];
    }

    // Helper function to extract field value (handles arrays and strings)
    const getField = (field: any): string | undefined => {
      if (field === undefined || field === null) return undefined;
      if (Array.isArray(field)) {
        const value = field[0];
        return value !== undefined && value !== null
          ? String(value)
          : undefined;
      }
      const str = String(field);
      // Return the string (even empty strings should pass through for validation)
      return str;
    };

    // Extract fields with proper handling
    const email = getField(body.email);
    const role = getField(body.role);
    const answerOne = getField(body.answerOne);

    // Validate required fields are present before DTO validation
    if (!email || !role || !answerOne) {
      const missingFields = [];
      if (!email) missingFields.push('email');
      if (!role) missingFields.push('role');
      if (!answerOne) missingFields.push('answerOne');
      throw new BadRequestException(
        `Missing required fields: ${missingFields.join(', ')}. Received body keys: ${Object.keys(body).join(', ')}. Please ensure all form fields are sent correctly.`,
      );
    }

    // Transform and validate form data (multipart/form-data)
    const welcomeDto = plainToInstance(WelcomeEmailDto, {
      email,
      role,
      answerOne,
      answerTwo: getField(body.answerTwo),
      answerThree: getField(body.answerThree),
      answerFour: getField(body.answerFour),
      answerFive: getField(body.answerFive),
    });

    const errors = await validate(welcomeDto);
    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => Object.values(error.constraints || {}))
        .flat();
      throw new BadRequestException(errorMessages.join(', '));
    }

    let cvUrl: string | undefined;
    if (cv) {
      cvUrl = await uploadCvToS3(cv);
    } else if (welcomeDto.role === 'INSTRUCTORS_USER') {
      throw new BadRequestException('CV file is required for instructors.');
    }

    const result = await this.authService.welcomeUserEmail({
      ...welcomeDto,
      cvUrl,
      userAgent,
    });

    // Only set cookies if tokens were issued (students). Instructors remain pending until approval.
    if (this.hasTokens(result)) {
      this.setCookie(
        res,
        'accessToken',
        result.accessToken,
        1000 * 60 * 60 * 24 * 1,
      );
      this.setCookie(
        res,
        'refreshToken',
        result.refreshToken,
        1000 * 60 * 60 * 24 * 7,
      );
    }

    return res.json({
      message: 'Role set and user welcomed successfully',
      data: {
        userId: result.userId,
        userRole: result.userRole,
      },
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Auth', 'Authentication')
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates a user with email and password. Returns user data and sets access/refresh tokens as HTTP-only cookies.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully. Tokens set as cookies.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User logged in successfully' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                isVerified: { type: 'boolean' },
                isActive: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or user not verified',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const { user, accessToken, refreshToken } =
      await this.authService.loginUserEmail({
        ...loginDto,
        userAgent,
      });

    this.setCookie(res, 'accessToken', accessToken, 1000 * 60 * 60 * 24 * 1);
    this.setCookie(res, 'refreshToken', refreshToken, 1000 * 60 * 60 * 24 * 7);

    return res.json({
      message: 'User logged in successfully',
      data: {
        user,
      },
    });
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiTags('Auth', 'OAuth')
  @ApiOperation({
    summary: 'Initiate Google OAuth login',
    description:
      'Redirects to Google OAuth consent screen. After user consent, redirects to /auth/google/callback.',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // Passport handles the redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiTags('Auth', 'OAuth')
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Handles Google OAuth callback. Creates or updates user account and redirects to frontend with appropriate tokens or welcome screen.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend application',
  })
  @ApiUnauthorizedResponse({ description: 'OAuth authentication failed' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = (req as any).user as any;
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
      this.setCookie(res, 'accessToken', accessToken, 1000 * 60 * 60 * 24 * 1);
      this.setCookie(
        res,
        'refreshToken',
        refreshToken,
        1000 * 60 * 60 * 24 * 7,
      );
      return res.redirect(`${Env.FRONTEND_ORIGIN}/instructors/dashboard`);
    } else if (user.role === 'STUDENT_USER') {
      this.setCookie(res, 'accessToken', accessToken, 1000 * 60 * 60 * 24 * 1);
      this.setCookie(
        res,
        'refreshToken',
        refreshToken,
        1000 * 60 * 60 * 24 * 7,
      );
      return res.redirect(`${Env.FRONTEND_ORIGIN}/students/dashboard`);
    } else {
      this.setCookie(res, 'accessToken', accessToken, 1000 * 60 * 60 * 24 * 1);
      this.setCookie(
        res,
        'refreshToken',
        refreshToken,
        1000 * 60 * 60 * 24 * 7,
      );
      return res.redirect(`${Env.FRONTEND_ORIGIN}/shopper/dashboard`);
    }
  }

  @Post('welcome-oauth-google')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Auth', 'OAuth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Welcome OAuth Google user and set role',
    description:
      'Sets the role for a Google OAuth user after initial authentication. Requires providerId from cookie set during OAuth callback. For INSTRUCTORS_USER role, CV file (PDF) is required. For STUDENT_USER role, CV is not needed.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role', 'answerOne'],
      properties: {
        role: {
          type: 'string',
          enum: ['STUDENT_USER', 'INSTRUCTORS_USER'],
          description: 'User role: STUDENT_USER or INSTRUCTORS_USER',
          example: 'STUDENT_USER',
        },
        answerOne: {
          type: 'string',
          description:
            'Answer 1: For STUDENT_USER - "What subjects are you most interested in?". For INSTRUCTORS_USER - "What subjects will you teach?"',
          example: 'Math, Physics, Web Development',
        },
        answerTwo: {
          type: 'string',
          description:
            'Answer 2: For STUDENT_USER - "What is your current level?". For INSTRUCTORS_USER - "How many years of teaching experience do you have?"',
          example: 'Beginner',
        },
        answerThree: {
          type: 'string',
          description:
            'Answer 3: For STUDENT_USER - "What is your primary learning goal for the next 3 months?". For INSTRUCTORS_USER - "What content format do you prefer?"',
          example: 'Pass a certification, Improve grades, Build a project',
        },
        answerFour: {
          type: 'string',
          description:
            'Answer 4: For STUDENT_USER - "How many hours per week can you study?". For INSTRUCTORS_USER - "What class size do you prefer?"',
          example: '3, 5, 10+',
        },
        answerFive: {
          type: 'string',
          description:
            'Answer 5: For STUDENT_USER - "Preferred learning style". For INSTRUCTORS_USER - "Your primary goal on Vonova"',
          example: 'Video lessons, Live sessions, Self-paced',
        },
        cv: {
          type: 'string',
          format: 'binary',
          description:
            'CV file upload (PDF only) - REQUIRED for INSTRUCTORS_USER role, NOT needed for STUDENT_USER role. Upload as multipart/form-data file field.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Role set and user welcomed successfully. Tokens set as cookies.',
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
            userRole: { type: 'string', example: 'STUDENT_USER' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid role, missing providerId cookie, or CV file missing for instructors',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing providerId' })
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async welcomeUseroAuthGoogle(
    @UploadedFile() cv: Express.Multer.File | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const providerId = req.cookies?.providerId;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Access form data directly from req.body (multer parses multipart/form-data)
    // Multer puts form fields in req.body as strings
    const rawBody = req.body as Record<string, any>;

    // Normalize body keys (trim whitespace from field names - common issue with form-data)
    const body: Record<string, any> = {};
    for (const key in rawBody) {
      const normalizedKey = key.trim();
      body[normalizedKey] = rawBody[key];
    }

    // Helper function to extract field value (handles arrays and strings)
    const getField = (field: any): string | undefined => {
      if (field === undefined || field === null) return undefined;
      if (Array.isArray(field)) {
        const value = field[0];
        return value !== undefined && value !== null
          ? String(value)
          : undefined;
      }
      return String(field);
    };

    // Extract fields with proper handling
    const role = getField(body.role);
    const answerOne = getField(body.answerOne);

    // Validate required fields are present before DTO validation
    if (!role || !answerOne) {
      const missingFields = [];
      if (!role) missingFields.push('role');
      if (!answerOne) missingFields.push('answerOne');
      throw new BadRequestException(
        `Missing required fields: ${missingFields.join(', ')}. Please ensure all form fields are sent correctly.`,
      );
    }

    // Transform and validate form data (multipart/form-data)
    const welcomeDto = plainToInstance(WelcomeOAuthGoogleDto, {
      role,
      answerOne,
      answerTwo: getField(body.answerTwo),
      answerThree: getField(body.answerThree),
      answerFour: getField(body.answerFour),
      answerFive: getField(body.answerFive),
    });

    const errors = await validate(welcomeDto);
    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => Object.values(error.constraints || {}))
        .flat();
      throw new BadRequestException(errorMessages.join(', '));
    }

    let cvUrl: string | undefined;
    if (cv) {
      cvUrl = await uploadCvToS3(cv);
    } else if (welcomeDto.role === 'INSTRUCTORS_USER') {
      throw new BadRequestException('CV file is required for instructors.');
    }

    const result = await this.authService.welcomeUseroAuthGoogle({
      providerId,
      userAgent,
      role: welcomeDto.role,
      answerOne: welcomeDto.answerOne,
      answerTwo: welcomeDto.answerTwo,
      answerThree: welcomeDto.answerThree,
      answerFour: welcomeDto.answerFour,
      answerFive: welcomeDto.answerFive,
      cvUrl,
    });

    // Only set cookies if tokens were issued (students). Instructors remain pending until approval.
    if (this.hasTokens(result)) {
      this.setCookie(
        res,
        'accessToken',
        result.accessToken,
        1000 * 60 * 60 * 24 * 1,
      );
      this.setCookie(
        res,
        'refreshToken',
        result.refreshToken,
        1000 * 60 * 60 * 24 * 7,
      );
    }
    res.clearCookie('providerId');

    return res.json({
      message: 'Role set and user welcomed successfully',
      data: {
        userId: result.userId,
        userRole: result.userRole,
      },
    });
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Auth', 'Authentication')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Refreshes the access token using a valid refresh token. Requires refreshToken cookie.',
  })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully. New tokens set as cookies.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Refreshed token successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const refresh_token = req.cookies?.refreshToken;

    if (!refresh_token) {
      throw new UnauthorizedException('Missing or invalid refresh token');
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken(
      refresh_token,
      userAgent,
    );

    this.setCookie(res, 'accessToken', accessToken, 1000 * 60 * 60 * 24 * 1);
    this.setCookie(res, 'refreshToken', refreshToken, 1000 * 60 * 60 * 24 * 7);

    return res.json({
      message: 'Refreshed token successfully',
    });
  }

  @Post('request-resetPass')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Password Reset')
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends a 6-digit password reset code to the user email address.',
  })
  @ApiBody({ type: RequestResetPasswordDto })
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
  @ApiBadRequestResponse({ description: 'Invalid email address' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async requestResetPassword(@Body() requestResetDto: RequestResetPasswordDto) {
    const result = await this.authService.requestResetPassword(
      requestResetDto.email,
    );
    return {
      message: result.message,
    };
  }

  @Post('verify-resetPass-code')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Password Reset')
  @ApiOperation({
    summary: 'Verify password reset code',
    description:
      'Verifies the password reset code and sets a reset token cookie for password reset.',
  })
  @ApiBody({ type: VerifyResetCodeDto })
  @ApiResponse({
    status: 200,
    description: 'Reset code verified successfully. Reset token set as cookie.',
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
  @ApiBadRequestResponse({ description: 'Invalid or expired reset code' })
  @ApiNotFoundResponse({ description: 'Reset code not found' })
  async verifyResetPassCode(
    @Body() verifyResetDto: VerifyResetCodeDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.verifyResetPasswordCode(
      verifyResetDto.email,
      verifyResetDto.otp_code,
    );

    this.setCookie(res, 'resetToken', result.resetToken, 1000 * 60 * 10);

    return res.json({
      message: result.message,
    });
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Password Reset')
  @ApiOperation({
    summary: 'Reset password',
    description:
      'Resets the user password using the reset token from cookie (set after verifying reset code).',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiCookieAuth('resetToken')
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
  @ApiUnauthorizedResponse({ description: 'Invalid or expired reset token' })
  @ApiBadRequestResponse({ description: 'Invalid password format' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    const resetToken = req.cookies?.resetToken;
    if (!resetToken) {
      throw new UnauthorizedException('Missing or invalid reset token');
    }

    const result = await this.authService.resetPassword(
      resetToken,
      resetPasswordDto.email,
      resetPasswordDto.newPassword,
    );
    return {
      message: result.message,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logs out the user from the current device. Invalidates the refresh token and clears authentication cookies.',
  })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing refresh token' })
  async logout(@Req() req: Request, @Res() res: Response) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing or invalid refresh token');
    }

    const result = await this.authService.logout(refreshToken, userAgent);

    this.clearCookie(res, 'accessToken');
    this.clearCookie(res, 'refreshToken');
    res.clearCookie('vonova_auth', {
      path: '/',
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.json({
      message: result.message,
    });
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Logout from all devices',
    description:
      'Logs out the user from all devices. Invalidates all refresh tokens for the user.',
  })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices successfully',
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
  @ApiUnauthorizedResponse({ description: 'Invalid or missing refresh token' })
  async logoutAllDevices(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing or invalid refresh token');
    }

    const result = await this.authService.logoutAllDevices(refreshToken);

    this.clearCookie(res, 'accessToken');
    this.clearCookie(res, 'refreshToken');

    return res.json({
      message: result.message,
    });
  }

  @Get('currentUser')
  @HttpCode(HttpStatus.OK)
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the current authenticated user information based on the access token cookie.',
  })
  @ApiCookieAuth('accessToken')
  @ApiResponse({
    status: 200,
    description: 'Current user fetched successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Current user fetched successfully',
        },
        user: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            isVerified: { type: 'boolean' },
            isActive: { type: 'boolean' },
            profilePicture: { type: 'string', nullable: true },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing access token' })
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
  @HttpCode(HttpStatus.OK)
  @ApiTags('User Management')
  @ApiOperation({
    summary: 'Validate role change',
    description:
      'Validates if a role change is allowed. Owner-only endpoint for role management.',
  })
  @ApiBody({ type: ValidateRoleChangeDto })
  @ApiResponse({
    status: 200,
    description: 'Role change validation successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Role change is valid' },
        data: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            currentRole: { type: 'string' },
            newRole: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid role change request' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Owner access required',
  })
  async validateRoleChange(
    @Body() validateRoleChangeDto: ValidateRoleChangeDto,
  ) {
    const result = await this.authService.validateRoleChange(
      validateRoleChangeDto,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Post('verify-and-permissions')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Internal')
  @ApiOperation({
    summary: 'Verify token and get permissions',
    description:
      'Internal endpoint to verify access token and return user permissions. Used by API Gateway for authorization.',
  })
  @ApiCookieAuth('accessToken')
  @ApiResponse({
    status: 200,
    description: 'Token verification successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Token verification successful' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            role: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            isVerified: { type: 'boolean' },
            isActive: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired access token' })
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
  @HttpCode(HttpStatus.OK)
  @ApiTags('User Management')
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
  @HttpCode(HttpStatus.OK)
  @ApiTags('User Management')
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
  @HttpCode(HttpStatus.OK)
  @ApiTags('User Management')
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
  @HttpCode(HttpStatus.OK)
  @ApiTags('User Management')
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
  @HttpCode(HttpStatus.OK)
  @ApiTags('User Management')
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
