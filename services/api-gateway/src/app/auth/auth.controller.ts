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

@Controller('api/v1/app/auth')
export class AuthGatewayController {
  constructor(private readonly authService: AuthGatewayService) {}

  // Register Flow
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent = 'unknown',
  ) {
    return this.authService.register(dto, userAgent);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

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

  @Post('check-coupon-code')
  checkCouponCode(@Body() dto: CheckCouponDto) {
    return this.authService.checkCouponCode(dto);
  }

  // Login
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

  @Get('current-user')
  currentUser(@Req() request: Request) {
    const accessToken = request.cookies?.accessToken;
    if (!accessToken) {
      throw new BadRequestException('Access token cookie is required');
    }
    return this.authService.currentUser(accessToken);
  }

  @Post('request-reset-password')
  requestResetPassword(@Body() dto: RequestResetPasswordDto) {
    return this.authService.requestResetPassword(dto);
  }

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

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    const resetToken = request.cookies?.resetToken;
    if (!resetToken) {
      throw new BadRequestException('Reset token cookie is required');
    }
    return this.authService.resetPassword({ ...dto, resetToken });
  }

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
