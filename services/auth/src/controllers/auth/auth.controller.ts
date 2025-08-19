import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import {
  registerUserService,
  verifyEmailCodeService,
  welcomeUserEmailService,
  loginUserEmailService,
  oAuthGoogleLoginService,
  welcomeUseroAuthGoogleService,
  refreshTokenService,
  requestResetPasswordService,
  verifyResetPasswordCodeService,
  resetPasswordService,
  logoutService,
  logoutAllDevicesService,
  validateRoleChangeService,
  getUserPermissionsService,
  verifyTokenService,
} from "../../services/auth/auth.service";
import { UnauthorizedException } from "../../utils/appError";

import { Env } from "../../config/env.config";
import { ProviderEnum } from "../../enums/account-provider.enum";

//? ************* Email Flow Controllers *************
// ============== Register Controller ==============
export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await registerUserService(req.body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: result.message,
    });
  }
);

export const verifyEmailCodeController = asyncHandler(
  async (req: Request, res: Response) => {
    await verifyEmailCodeService(req.body.email, req.body.code);

    return res.status(HTTPSTATUS.OK).json({
      message: "Email verified successfully"
    });
  }
);

export const welcomeUserEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"] || "unknown";
    const result = await welcomeUserEmailService({
      ...req.body,
      userAgent
    });

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day in ms
      path: '/',
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Role set and user welcomed successfully",
      data: {
        userId: result.userId,
        userRole: result.userRole,
        createUser: result.createUser,
      }
    });
  }
);

// ============== Login Controller ==============
export const loginUserEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"] || "unknown";
    const { user, accessToken, refreshToken } = await loginUserEmailService({
      ...req.body,
      userAgent,
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day in ms
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "User logged in successfully",
      data: {
        user,
      }
    });
  }
);

//! **************** oAuth2 Flow Services ****************
// ============== Register or Login Controller ==============
export const oAuthGoogleLoginController = asyncHandler(
  async (req: Request, res: Response) => {
    const googleUser = req.user as any;
    if (!googleUser) {
      return res.redirect(`${Env.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`);
    }

    // Call oauth2LoginService to ensure user is created/found and get fresh user object
    const { user, isNewUser, providerId, accessToken, refreshToken } = await oAuthGoogleLoginService({
      provider: ProviderEnum.GOOGLE,
      displayName: googleUser.name || googleUser.displayName,
      providerId: googleUser.providerId || googleUser._id || googleUser.id,
      picture: googleUser.profilePicture || googleUser.picture,
      email: googleUser.email,
      userAgent: req.headers["user-agent"] || "unknown",
    });

    // Redirect to frontend with tokens and isNewUser flag
    if (isNewUser || user.role === "PENDING") {
      res.cookie('providerId', providerId,
        {
          httpOnly: true,
          secure: true,
          sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
        });
      return res.redirect(`${Env.FRONTEND_GOOGLE_CALLBACK_URL}?welcome=true`);
    } else if (user.role === "INSTRUCTOR") {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      return res.redirect(`${Env.FRONTEND_ORIGIN}/instructor/dashboard`);
    } else {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: Env.NODE_ENV === 'production',
        sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      return res.redirect(`${Env.FRONTEND_ORIGIN}/student/dashboard`);
    }
  }
);

export const welcomeUseroAuthGoogleController = asyncHandler(
  async (req: Request, res: Response) => {
    // You can get providerId from the cookie or from req.body (sent by frontend)
    const providerId = req.cookies?.providerId;
    const userAgent = req.headers["user-agent"] || "unknown";
    const { role, answerOne } = req.body;

    const result = await welcomeUseroAuthGoogleService({
      providerId,
      userAgent,
      role,
      answerOne,
    });

    // Set tokens as HTTP-only cookies
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day in ms
      path: '/',
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    res.clearCookie('providerId');

    // Respond with user info and redirect URL
    return res.status(HTTPSTATUS.OK).json({
      message: "Role set and user welcomed successfully",
      data: {
        userId: result.userId,
        userRole: result.userRole,
        createUser: result.createUser,
      },
    });
  }
);

// ============== Refresh Token Controllers ==============
export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"] || "unknown";

    // Extract the refresh token from the Authorization header
    const refresh_token = req.cookies?.refreshToken;
    if (!refresh_token) {
      throw new UnauthorizedException("Missing or invalid refresh token");
    }

    const { accessToken, refreshToken } = await refreshTokenService(
      refresh_token,
      userAgent
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day in ms
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Refreshed token successfully",
    });
  }
);

// ============== Forget Password Controllers ==============
export const requestResetPassController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await requestResetPasswordService(req.body.email);

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
    });
  }
);

export const verifyResetPassCodeController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await verifyResetPasswordCodeService(req.body.email, req.body.code);

    res.cookie('resetToken', result.resetToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 10, // 10m in ms
      path: '/',
    });

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
    });
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const resetToken = req.cookies?.resetToken;
    if (!resetToken) {
      throw new UnauthorizedException("Missing or invalid reset token");
    }
    const { newPassword } = req.body;
    const result = await resetPasswordService(resetToken, newPassword);

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
    });
  }
);

// ============== Logout Controllers ==============
export const logOutController = asyncHandler(
  async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"] || "unknown";

    // Extract the refresh token from the Authorization header
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException("Missing or invalid refresh token");
    }

    const result = await logoutService(refreshToken, userAgent);

    // Clear the cookies after logout
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
    });
  }
);

export const logOutAllDevicesController = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException("Missing or invalid refresh token");
    }

    const result = await logoutAllDevicesService(refreshToken);

    // Clear the cookies after logout
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
    });
  }
);

// ============== Role Change Validation Controller ==============
export const validateRoleChangeController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await validateRoleChangeService(req.body);

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
      data: result.data,
    });
  }
);

// ============== Utility Controllers for Inter-Service Communication ==============
export const getUserPermissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await getUserPermissionsService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User permissions retrieved successfully",
      data: result,
    });
  }
);

export const verifyTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await verifyTokenService(token);

    return res.status(HTTPSTATUS.OK).json({
      message: "Token verification successful",
      data: result,
    });
  }
);
