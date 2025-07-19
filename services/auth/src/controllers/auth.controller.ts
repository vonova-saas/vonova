import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
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
} from "../services/auth.service";
import { UnauthorizedException } from "../utils/appError";

import { Env } from "../config/env.config";
import { ProviderEnum } from "../enums/account-provider.enum";
import { resourceLimits } from "worker_threads";

//? ************* Email Flow Controllers *************
// ============== Register Controller ==============
export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { user } = await registerUserService(req.body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User registered successfully, you will receive a verification email.",
      data: user.omitPassword(),
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
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes in ms
      path: '/',
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: 'lax',
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
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes in ms
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: 'lax',
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
      res.cookie('providerId', providerId, { httpOnly: true, secure: true, sameSite: 'lax' });
      return res.redirect(`${Env.FRONTEND_GOOGLE_CALLBACK_URL}?welcome=true`);
    } else if (user.role === "INSTRUCTOR") {
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'lax' });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax' });
      return res.redirect(`${Env.FRONTEND_ORIGIN}/instructor/dashboard`);
    } else {
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'lax' });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax' });
      return res.redirect(`${Env.FRONTEND_ORIGIN}/student/dashboard`);
    }
  }
);

export const welcomeUseroAuthGoogleController = asyncHandler(
  async (req: Request, res: Response) => {
    // You can get providerId from the cookie or from req.body (sent by frontend)
    const providerId = req.body.providerId;
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
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes in ms
      path: '/',
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: 'lax',
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid access token");
    }

    const refresh_token = authHeader.split(" ")[1];

    const { accessToken, refreshToken } = await refreshTokenService(
      refresh_token,
      userAgent
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes in ms
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: Env.NODE_ENV === 'production',
      sameSite: 'lax',
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

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
      data: {
        resetToken: result.resetToken,
      }
    });
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await resetPasswordService(req.body.resetToken, req.body.newPassword);

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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid refresh token");
    }
    const refreshToken = authHeader.split(" ")[1];

    const result = await logoutService(refreshToken, userAgent);

    return res.status(HTTPSTATUS.OK).json({
      message: result.message,
    });
  }
);

export const logOutAllDevicesController = asyncHandler(
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;[]
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid refresh token");
    }
    const refreshToken = authHeader.split(" ")[1];

    const result = await logoutAllDevicesService(refreshToken);

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
