import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminAuthService } from './admin-auth.service';
import { RequestLoginCodeDto } from './dto/request-login-code.dto';
import { VerifyLoginDto } from './dto/verify-login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AdminRefreshTokenDto } from './dto/refresh-token.dto';
import { AdminLogoutDto } from './dto/logout.dto';

@Controller()
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) { }

  /**
   * NATS: Request OTP login code
   * Message Pattern: admin.auth.request-login-code
   * Called by API Gateway when admin requests login code
   */
  @MessagePattern('admin.auth.request-login-code')
  async handleRequestLoginCode(
    @Payload() dto: RequestLoginCodeDto,
  ): Promise<{ message: string }> {
    return this.adminAuthService.requestLoginCode(dto);
  }

  /**
   * NATS: Verify OTP and get JWT token
   * Message Pattern: admin.auth.verify-login
   * Called by API Gateway when admin submits OTP
   */
  @MessagePattern('admin.auth.verify-login')
  async handleVerifyLogin(
    @Payload() dto: VerifyLoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.adminAuthService.verifyLogin(dto);
  }

  /**
   * NATS: Reset password
   * Message Pattern: admin.auth.reset-password
   * Called by API Gateway when admin resets password
   * Note: Authentication is handled by API Gateway before forwarding
   */
  @MessagePattern('admin.auth.reset-password')
  async handleResetPassword(
    @Payload() payload: { adminId: string } & ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.adminAuthService.resetPassword(payload.adminId, payload);
  }

  @MessagePattern('admin.auth.refresh-token')
  async handleRefreshToken(
    @Payload() dto: AdminRefreshTokenDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.adminAuthService.refreshToken(dto.refreshToken);
  }

  @MessagePattern('admin.auth.logout')
  async handleLogout(
    @Payload() dto: AdminLogoutDto,
  ): Promise<{ message: string }> {
    return this.adminAuthService.logout(dto.refreshToken);
  }

  @MessagePattern('admin.auth.current-user')
  async handleCurrentUser(
    @Payload() accessToken: string,
  ): Promise<{ message: string; user: { _id: string; name: string; email: string; role: string } }> {
    return this.adminAuthService.getCurrentUser(accessToken);
  }
}
