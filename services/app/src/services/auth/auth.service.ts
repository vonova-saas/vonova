import { v4 as uuidv4 } from "uuid";
import UserModel from "../../models/auth/user.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../utils/appError";
import { generateDeviceHash, hashValue } from "../../utils/bcrypt";
import {
  AccessTPayload,
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyAccessToken,
  verifyJwtToken,
} from "../../utils/jwt";
import RefreshTokenModel from "../../models/auth/refreshToken.model";
import PasswordResetModel from "../../models/auth/passwordReset.model";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendWelcomeEmail,
} from "./email.service";
import EmailVerificationModel from "../../models/auth/emailVerification.model";
import AccountModel from "../../models/auth/account.model";
import { ProviderEnum } from "../../enums/account-provider.enum";
import { Roles } from "../../enums/role.enum";
import { RolePermissions } from "../../utils/role-permission";
import UserAccountModel from "../../models/settings/userAccount.model";

//? ************* Email Flow Services *************
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
    role: Roles.PENDING,
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

  return { message: "User registered successfully, you will receive a verification email." };
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

  return {
    message: "Email verified successfully"
  };
};

export const welcomeUserEmailService = async (body: {
  email: string;
  userAgent: string;
  role: string;
  answerOne: string;
}) => {
  const { email, userAgent, role, answerOne } = body;

  const account = await AccountModel.findOne({ provider: ProviderEnum.EMAIL, providerId: email });
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

  //? Add User Role & Update last login
  if (user.role !== Roles.PENDING) {
    throw new BadRequestException("Role already set");
  }

  // Validate role
  if (![Roles.STUDENT_USER, Roles.INSTRUCTORS_USER].includes(role as any)) {
    throw new BadRequestException("Invalid role");
  }

  if (!Object.values(Roles).includes(role as any)) {
    throw new BadRequestException("Invalid role");
  }
  user.role = role as typeof Roles[keyof typeof Roles];
  user.lastLogin = new Date();
  await user.save();

  //* Create access Token and refresh Token
  const jti = uuidv4();
  const deviceHash = generateDeviceHash(userAgent);

  const [accessToken, refreshToken] = await Promise.all([
    signJwtToken({ userId: user._id, role: user.role }),
    signJwtToken({ userId: user._id, jti, role: user.role }, refreshTokenSignOptions),
  ]);

  await RefreshTokenModel.deleteMany({ userId: user._id, deviceHash });

  const tokenHash = await hashValue(refreshToken);
  await RefreshTokenModel.create({
    userId: user._id,
    tokenHash,
    jti,
    deviceHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await UserAccountModel.create({
    userId: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.profilePicture,
  });

  await sendWelcomeEmail(user.email, user.name);

  return {
    userId: user._id,
    userRole: user.role,
    accessToken,
    refreshToken,
  };
}

// ============== Login Service ==============
export const loginUserEmailService = async (body: {
  email: string;
  password: string;
  userAgent: string;
}) => {
  const { email, password, userAgent } = body;

  const account = await AccountModel.findOne({ provider: ProviderEnum.EMAIL, providerId: email });
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
    signJwtToken({ userId: user._id, role: user.role }),
    signJwtToken({ userId: user._id, jti, role: user.role }, refreshTokenSignOptions),
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

//! **************** oAuth Google Flow Services ****************
// ============== Register or Login Service ==============
export const oAuthGoogleLoginService = async (data: {
  provider: string;
  displayName: string;
  providerId: string;
  picture?: string;
  email?: string;
  userAgent: string;
}) => {
  const { providerId, provider, displayName, email, picture, userAgent } = data;

  // First, check if user exists by email
  let user = await UserModel.findOne({ email });
  let isNewUser = false;

  if (!user) {
    // New user: create with PENDING role, no tokens yet
    user = new UserModel({
      name: displayName,
      email,
      profilePicture: picture || null,
      role: Roles.PENDING,
      isVerified: true, // Google users are always verified
    });
    await user.save();

    const account = new AccountModel({
      userId: user._id,
      provider: provider,
      providerId: providerId,
    });
    await account.save();

    await sendWelcomeEmail(user.email, user.name);
    isNewUser = true;

    return {
      user: user.omitPassword(),
      isNewUser,
      providerId, // Always return providerId for the welcome step
    };
  }

  user.lastLogin = new Date();
  await user.save();

  //* Create access Token and refresh Token
  const jti = uuidv4();
  const deviceHash = generateDeviceHash(userAgent);

  const [accessToken, refreshToken] = await Promise.all([
    signJwtToken({ userId: user._id, role: user.role }),
    signJwtToken({ userId: user._id, jti, role: user.role }, refreshTokenSignOptions),
  ]);

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
    isNewUser: false,
  };
};

export const welcomeUseroAuthGoogleService = async (body: {
  providerId: string;
  userAgent: string;
  role: string;
  answerOne: string;
}) => {
  const { providerId, userAgent, role, answerOne } = body;

  const account = await AccountModel.findOne({ provider: ProviderEnum.GOOGLE, providerId });
  if (!account) {
    throw new NotFoundException("Invalid email");
  }

  const user = await UserModel.findById(account.userId);
  if (!user) {
    throw new NotFoundException("User not found for the given account");
  }

  //? Add User Role & Update last login
  if (user.role !== Roles.PENDING) {
    throw new BadRequestException("Role already set");
  }

  // Validate role
  if (![Roles.STUDENT_USER, Roles.INSTRUCTORS_USER].includes(role as any)) {
    throw new BadRequestException("Invalid role");
  }

  if (!Object.values(Roles).includes(role as any)) {
    throw new BadRequestException("Invalid role");
  }
  user.role = role as typeof Roles[keyof typeof Roles];
  user.lastLogin = new Date();
  await user.save();

  //* Create access Token and refresh Token
  const jti = uuidv4();
  const deviceHash = generateDeviceHash(userAgent);

  const [accessToken, refreshToken] = await Promise.all([
    signJwtToken({ userId: user._id, role: user.role }),
    signJwtToken({ userId: user._id, jti, role: user.role }, refreshTokenSignOptions),
  ]);

  await RefreshTokenModel.deleteMany({ userId: user._id, deviceHash });

  const tokenHash = await hashValue(refreshToken);
  await RefreshTokenModel.create({
    userId: user._id,
    tokenHash,
    jti,
    deviceHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await sendWelcomeEmail(user.email, user.name);

  return {
    userId: user._id,
    userRole: user.role,
    accessToken,
    refreshToken,
  };
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
  const user = await UserModel.findById(payload.userId);
  if (!user) throw new UnauthorizedException("User not found");
  const newJti = uuidv4();
  const [newAccessToken, newRefreshToken] = await Promise.all([
    signJwtToken({ userId: payload.userId, role: user.role }),
    signJwtToken(
      { userId: payload.userId, jti: newJti, role: user.role },
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
    {
      userId: user._id,
      role: ""
    },
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

// ============== Role Change Validation Service ==============
export const validateRoleChangeService = async (params: {
  userId: string;
  newRole: string;
  adminUserId: string;
}) => {
  const { userId, newRole, adminUserId } = params;

  // Validate admin user exists and has admin role
  const adminUser = await UserModel.findById(adminUserId);
  if (!adminUser) {
    throw new NotFoundException("Admin user not found");
  }

  if (adminUser.role !== Roles.PENDING) {
    throw new UnauthorizedException("Only administrators can change user roles");
  }

  // Validate target user exists
  const targetUser = await UserModel.findById(userId);
  if (!targetUser) {
    throw new NotFoundException("Target user not found");
  }

  // Validate new role is valid
  if (!Object.values(Roles).includes(newRole as any)) {
    throw new BadRequestException("Invalid role specified");
  }

  // Prevent admin from changing their own role
  if (userId === adminUserId) {
    throw new BadRequestException("Administrators cannot change their own role");
  }

  // Prevent changing to ADMIN role (only system can create admins)
  if (newRole === Roles.PENDING) {
    throw new BadRequestException("Cannot assign ADMIN role through this endpoint");
  }

  // Check if role change is actually needed
  if (targetUser.role === newRole) {
    throw new BadRequestException("User already has the specified role");
  }

  // Validate role
  if (![Roles.STUDENT_USER, Roles.INSTRUCTORS_USER].includes(newRole as any)) {
    throw new BadRequestException("Invalid role");
  }

  if (!Object.values(Roles).includes(newRole as any)) {
    throw new BadRequestException("Invalid role");
  }
  targetUser.role = newRole as typeof Roles[keyof typeof Roles];
  await targetUser.save();

  return {
    valid: true,
    message: "Role change validation successful",
    data: {
      currentRole: targetUser.role,
      newRole: newRole,
      targetUser: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email
      },
      adminUser: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email
      }
    }
  };
};

// ============== Utility Services for Inter-Service Communication ==============
export const verifyAndPermissionsService = async (token: string) => {
  const { payload, error } = verifyAccessToken(token);

  if (error || !payload) {
    throw new UnauthorizedException("Invalid or expired token");
  }

  const user = await UserModel.findById(payload.userId);
  if (!user) {
    throw new UnauthorizedException("User not found");
  }

  const permissions = (RolePermissions as Record<string, string[]>)[user.role] || [];

  if (!user.isActive) {
    throw new UnauthorizedException("User account is deactivated");
  }

  return {
    valid: true,
    user: {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified
    },
    permissions: permissions
  };
};