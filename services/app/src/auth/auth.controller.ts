import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { UploadedFile } from '../common/interfaces/file.interface';
import { AuthService } from './auth.service';
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
import { ApproveInstructorDto } from './dto/approve-instructor.dto';
import { AdminResetPasswordRpcDto } from './dto/admin-reset-password-rpc.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register' })
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern({ cmd: 'verifyEmail' })
  verifyEmail(@Payload() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @MessagePattern({ cmd: 'welcomeEmail' })
  welcomeEmail(@Payload() dto: WelcomeEmailDto) {
    return this.authService.welcomeEmail(dto);
  }

  @MessagePattern({ cmd: 'uploadProfilePicture' })
  uploadProfilePicture(
    @Payload() dto: UploadProfilePictureDto & { file: UploadedFile },
  ) {
    return this.authService.uploadProfilePicture(dto);
  }

  @MessagePattern({ cmd: 'checkCouponCode' })
  checkCouponCode(@Payload() dto: CheckCouponDto) {
    return this.authService.checkCouponCode(dto);
  }

  @MessagePattern({ cmd: 'oAuthGoogleLogin' })
  oAuthGoogleLogin(@Payload() dto: OAuthGoogleLoginDto) {
    return this.authService.oAuthGoogleLogin(dto);
  }

  @MessagePattern({ cmd: 'welcomeUserOAuthGoogle' })
  welcomeUserOAuthGoogle(@Payload() dto: OAuthWelcomeDto) {
    return this.authService.welcomeUserOAuthGoogle(dto);
  }

  @MessagePattern({ cmd: 'login' })
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern({ cmd: 'approveInstructor' })
  approveInstructor(@Payload() dto: ApproveInstructorDto) {
    return this.authService.approveInstructor(dto);
  }

  @MessagePattern({ cmd: 'rejectInstructor' })
  rejectInstructor(@Payload() dto: ApproveInstructorDto) {
    return this.authService.rejectInstructor(dto);
  }

  @MessagePattern({ cmd: 'listPendingInstructors' })
  listPendingInstructors() {
    return this.authService.listPendingInstructors();
  }

  @MessagePattern({ cmd: 'refreshToken' })
  refreshToken(@Payload() token: string) {
    return this.authService.refreshToken(token);
  }

  @MessagePattern({ cmd: 'logout' })
  logout(@Payload() token: string) {
    return this.authService.logout(token);
  }

  @MessagePattern({ cmd: 'logoutAll' })
  logoutAll(@Payload() payload: { accessToken: string }) {
    return this.authService.logoutAll(payload);
  }

  @MessagePattern({ cmd: 'currentUser' })
  getCurrentUser(@Payload() accessToken: string) {
    return this.authService.getCurrentUser(accessToken);
  }

  @MessagePattern({ cmd: 'adminResetPassword' })
  adminResetPassword(@Payload() payload: AdminResetPasswordRpcDto) {
    const { accessToken, oldPassword, newPassword } = payload;
    return this.authService.adminResetPassword(accessToken, {
      oldPassword,
      newPassword,
    });
  }

  @MessagePattern({ cmd: 'requestResetPassword' })
  requestResetPassword(@Payload() dto: RequestResetPasswordDto) {
    return this.authService.requestResetPassword(dto);
  }

  @MessagePattern({ cmd: 'verifyResetCode' })
  verifyResetCode(@Payload() dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @MessagePattern({ cmd: 'resetPassword' })
  resetPassword(@Payload() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
