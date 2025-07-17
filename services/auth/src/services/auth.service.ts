import { v4 as uuidv4 } from "uuid";
import UserModel from "../models/user.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";
import { generateDeviceHash, hashValue } from "../utils/bcrypt";
import {
  AccessTPayload,
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from "../utils/jwt";
import RefreshTokenModel from "../models/refreshToken.model";
import PasswordResetModel from "../models/passwordReset.model";
import { getRedisTokenKey, redisClient } from "../config/redis.config";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendWelcomeEmail,
} from "../services/email.service";
import EmailVerificationModel from "../models/emailVerification.model";

import mongoose from "mongoose";
import AccountModel from "../models/account.model";
import RoleModel from "../models/roles-permission.model";
import { Roles } from "../enums/role.enum";
import { ProviderEnum, ProviderEnumType } from "../enums/account-provider.enum";

// ============== Register Service ==============
export const registerUserService = async (body: {
  name: string;
  email: string;
  password: string;
}) => {
  const { email, name, password } = body;

  const existingUser = await UserModel.findOne({ email }).exec();
  if (existingUser) throw new BadRequestException("Email already exist");

  const user = new UserModel({
    name,
    email,
    password,
  });
  await user.save();

  const account = new AccountModel({
    userId: user._id,
    provider: ProviderEnum.EMAIL,
    providerId: email,
  });
  await account.save();

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  await EmailVerificationModel.create({
    email,
    verificationCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  await sendVerificationEmail(user.email, verificationCode);

  return { user };
};

export const verifyEmailCodeService = async (email: string, otp_code: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new NotFoundException("User not found");

  const verificationRecord = await EmailVerificationModel.findOne({
    email,
    verificationCode: otp_code,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!verificationRecord) {
    throw new BadRequestException("Invalid or expired verification code");
  }

  verificationRecord.used = true;
  await verificationRecord.save();

  user.isVerified = true;
  await user.save();

  return { message: "Email verified successfully" };
};

export const welcomeuserService = async ({
  email,
  workspaceName,
  provider = ProviderEnum.EMAIL,
}: {
  email: string,
  workspaceName: string,
  provider?: string
}) => {
  const account = await AccountModel.findOne({ provider, providerId: email });
  if (!account) {
    throw new NotFoundException("Invalid email");
  }

  const user = await UserModel.findById(account.userId);
  if (!user) {
    throw new NotFoundException("User not found for the given account");
  }

  const isUserVerified = user.isVerified;
  if (!isUserVerified) {
    throw new BadRequestException("You should verify your email first!");
  }

  // const ownerRole = await RoleModel.findOne({
  //   name: Roles.OWNER,
  // });

  // if (!ownerRole) {
  //   throw new NotFoundException("Owner role not found");
  // }

  await sendWelcomeEmail(user.email, user.name);

  return {
    userId: user._id
  };
}

// ============== Login Service ==============
export const loginUserEmailService = async ({
  email,
  password,
  userAgent,
  provider = ProviderEnum.EMAIL,
}: {
  email: string;
  password: string;
  userAgent: string;
  provider?: string;
}) => {
  // const { email, password, userAgent } = body;

  const account = await AccountModel.findOne({ provider, providerId: email });
  if (!account) {
    throw new NotFoundException("User not found for the given account");
  }

  const user = await UserModel.findById(account.userId);
  if (!user) {
    throw new NotFoundException("User not found for the given account");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new BadRequestException("Invalid credentials");
  }

  const isUserVerified = user.isVerified;
  if (!isUserVerified) {
    throw new BadRequestException("You should verify your email first!");
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const jti = uuidv4();
  const deviceHash = generateDeviceHash(userAgent);

  const [accessToken, refreshToken] = await Promise.all([
    signJwtToken({ userId: user._id }),
    signJwtToken({ userId: user._id, jti }, refreshTokenSignOptions),
  ]);

  // Redis cache part
  // const redisKey = getRedisTokenKey(user._id as string, deviceHash);
  // await redisClient.del(redisKey);
  // await redisClient.set(redisKey, jti, {
  //   ex: 604800 // 7 days
  // });

  // Without using Redis
  await RefreshTokenModel.deleteMany({ userId: user._id, deviceHash });

  const tokenHash = await hashValue(refreshToken);
  await RefreshTokenModel.create({
    userId: user._id,
    tokenHash,
    jti,
    deviceHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const oauth2LoginService = async (
  body: {
    provider: string;
    displayName: string;
    providerId: string;
    picture?: string;
    email?: string;
  }
) => {
  const { providerId, provider, displayName, email, picture } = body;

  let user = await UserModel.findOne({ email });

  if (!user) {
    // Create a new user if it doesn't exist
    user = new UserModel({
      name: displayName,
      email,
      profilePicture: picture || null,
    });
    await user.save();

    const account = new AccountModel({
      userId: user._id,
      provider: provider,
      providerId: providerId,
    });
    await account.save();

    await sendWelcomeEmail(user.email, user.name);
  }

  return { user };
}

// ============== Refresh Token Service ==============
export const refreshTokenService = async (
  refresh_token: string,
  userAgent: string
) => {
  const { payload } = verifyJwtToken<RefreshTPayload>(refresh_token, {
    secret: refreshTokenSignOptions.secret,
  });
  if (!payload) throw new UnauthorizedException("Invalid refresh token");

  const deviceHash = generateDeviceHash(userAgent);
  // Redis cache part
  // const redisKey = getRedisTokenKey(payload.userId as string, deviceHash);
  // const storedJti = await redisClient.get(redisKey);

  // if (!storedJti || storedJti !== payload.jti) {
  //   await revokeAllUserTokens(payload.userId as string);
  //   throw new UnauthorizedException(
  //     "Invalid or revoked token due to security reasons"
  //   );
  // }

  // Without using Redis
  const storedToken = await RefreshTokenModel.findOne({
    jti: payload.jti,
  });

  if (!storedToken) {
    await revokeAllUserTokens(payload.userId as string);
    throw new UnauthorizedException("Invalid or revoked token due to security reasons");
  }

  if (storedToken.deviceHash !== deviceHash) {
    await revokeAllUserTokens(payload.userId as string);
    throw new UnauthorizedException("Device mismatch - possible attack");
  }

  await RefreshTokenModel.deleteOne({ jti: payload.jti });

  // ---------- default ----------
  const newJti = uuidv4();
  const [newAccessToken, newRefreshToken] = await Promise.all([
    signJwtToken({ userId: payload.userId }),
    signJwtToken(
      { userId: payload.userId, jti: newJti },
      refreshTokenSignOptions
    ),
  ]);
  // ------------------------------

  // Without using Redis
  const tokenHash = await hashValue(newRefreshToken);
  await RefreshTokenModel.create({
    userId: payload.userId,
    tokenHash,
    jti: newJti,
    deviceHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Redis cache part
  // await redisClient
  //   .multi()
  //   .del(redisKey)
  //   .set(redisKey, newJti, {
  //     ex: 604800, // 7 days
  //   })
  //   .exec();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const revokeAllUserTokens = async (userId: string) => {
  // Without using Redis
  await RefreshTokenModel.deleteMany({ userId });

  // Redis cache part
  // const keys = await redisClient.keys(`refresh:${userId}:*`);
  // if (keys.length > 0) await redisClient.del(...keys);

  console.warn(`Potential attack detected for user ${userId}`);
};

// ============== Forget Password Service ==============
export const requestResetPasswordService = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new NotFoundException("User not found");
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  await PasswordResetModel.deleteMany({ email });

  await PasswordResetModel.create({
    email,
    resetCode,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  });

  await sendPasswordResetEmail(user.email, resetCode);

  return { message: "A reset code has been sent successfully" };
};

export const verifyResetPasswordCodeService = async (
  email: string,
  code: string
) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new NotFoundException("Invalid request");

  // Find the reset code
  const resetRecord = await PasswordResetModel.findOne({
    email,
    resetCode: code,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!resetRecord) {
    throw new BadRequestException("Invalid or expired reset code");
  }

  // Mark the reset code as used
  resetRecord.used = true;
  await resetRecord.save();

  // Generate a temporary token for password reset (valid for 10 minutes)
  const resetToken = signJwtToken(
    { userId: user._id },
    {
      expiresIn: "10m",
      secret: refreshTokenSignOptions.secret, // Use refresh secret for extra security
    }
  );

  return {
    resetToken,
    message: "Reset code verified successfully"
  };
};

export const resetPasswordService = async (
  resetToken: string,
  newPassword: string
) => {
  const { payload } = verifyJwtToken<AccessTPayload>(resetToken, {
    secret: refreshTokenSignOptions.secret,
  });

  if (!payload) throw new UnauthorizedException("Invalid or expired reset token");

  const user = await UserModel.findById(payload.userId);
  if (!user) throw new NotFoundException("User not found");

  user.password = newPassword;
  await user.save();

  await revokeAllUserTokens(user._id as string);

  await sendPasswordResetConfirmationEmail(user.email);

  return { message: "Password reset successfully" };
};

// ============== Logout Service ==============
export const logoutService = async (
  refreshToken: string,
  userAgent: string
) => {
  const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });

  if (!payload) {
    // Token is already invalid, consider it a successful logout
    return { message: "Logged out successfully" };
  }

  const deviceHash = generateDeviceHash(userAgent);

  // Remove the specific refresh token
  await RefreshTokenModel.deleteOne({
    jti: payload.jti,
    deviceHash,
  });

  // Redis cache part
  // const redisKey = getRedisTokenKey(payload.userId as string, deviceHash);
  // await redisClient.del(redisKey);

  return { message: "Logged out successfully" };
};

export const logoutAllDevicesService = async (
  refreshToken: string
) => {
  const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });

  if (!payload) throw new UnauthorizedException("Invalid refresh token");

  await revokeAllUserTokens(payload.userId as string);

  return { message: "Logged out from all devices successfully" };
};