import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  loginUserEmailService,
  oauth2LoginService,
  logoutAllDevicesService,
  logoutService,
  refreshTokenService,
  registerUserService,
  requestResetPasswordService,
  resetPasswordService,
  verifyEmailCodeService,
  verifyResetPasswordCodeService,
} from "../services/auth.service";
import { UnauthorizedException } from "../utils/appError";

import { Env } from "../config/env.config";

// ============== Register controllers ==============
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
      message: "Email verified successfully",
    });
  }
);

// ============== Login controllers ==============
export const loginUserEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"] || "unknown";
    const { user, accessToken, refreshToken } = await loginUserEmailService({
      ...req.body,
      userAgent,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "User logged in successfully",
      data: {
        user,
        accessToken,
        refreshToken,
      }
    });
  }
);

// ============== OAuth controllers ==============
// export const googleLoginCallback = asyncHandler(
//   async (req: Request, res: Response) => {
//     const currentWorkspace = req.user?.currentWorkspace;

//     if (!currentWorkspace) {
//       return res.redirect(
//         `${Env.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`
//       );
//     }

//     return res.redirect(
//       `${Env.FRONTEND_ORIGIN}/workspace/${currentWorkspace}`
//     );
//   }
// );

// ============== Refresh Token controllers ==============
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

    return res.status(HTTPSTATUS.OK).json({
      message: "Refreshed token successfully",
      accessToken,
      refreshToken,
    });
  }
);

// ============== Forget Password controllers ==============
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

// ============== Logout controllers ==============
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
