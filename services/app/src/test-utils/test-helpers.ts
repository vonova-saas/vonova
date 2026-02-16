import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Account, AccountDocument } from '../auth/schemas/account.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../auth/schemas/refresh-token.schema';
import {
  EmailVerification,
  EmailVerificationDocument,
} from '../auth/schemas/email-verification.schema';
import {
  PasswordReset,
  PasswordResetDocument,
} from '../auth/schemas/password-reset.schema';
import { Roles } from '../enums/role.enum';
import { ProviderEnum } from '../enums/account-provider.enum';

/**
 * Test helper utilities for creating mock data and test fixtures
 */

export const createMockUser = (
  overrides?: Partial<User>,
): Partial<User> & { _id: string } => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashedPassword123',
  role: Roles.PENDING,
  isVerified: false,
  isActive: true,
  profilePicture: null,
  lastLogin: null,
  ...overrides,
});

export const createMockAccount = (
  overrides?: Partial<Account>,
): Partial<Account> & { _id: string } => ({
  _id: '507f1f77bcf86cd799439012',
  userId: '507f1f77bcf86cd799439011' as any,
  provider: ProviderEnum.EMAIL,
  providerId: 'test@example.com',
  refreshToken: null,
  tokenExpiry: null,
  ...overrides,
});

export const createMockRefreshToken = (
  overrides?: Partial<RefreshToken>,
): Partial<RefreshToken> & { _id: string } => ({
  _id: '507f1f77bcf86cd799439013',
  jti: 'test-jti-123',
  tokenHash: 'hashedToken123',
  userId: '507f1f77bcf86cd799439011' as any,
  deviceHash: 'deviceHash123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  ...overrides,
});

export const createMockEmailVerification = (
  overrides?: Partial<EmailVerification>,
): Partial<EmailVerification> & { _id: string } => ({
  _id: '507f1f77bcf86cd799439014',
  email: 'test@example.com',
  verificationCode: '123456',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  used: false,
  ...overrides,
});

export const createMockPasswordReset = (
  overrides?: Partial<PasswordReset>,
): Partial<PasswordReset> & { _id: string } => ({
  _id: '507f1f77bcf86cd799439015',
  email: 'test@example.com',
  resetCode: '123456',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  used: false,
  ...overrides,
});

/**
 * Create a mock Mongoose model
 */
export const createMockModel = <T>(): Model<T> => {
  const model = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
  } as any;

  return model as Model<T>;
};

/**
 * Create a mock user document with methods
 */
export const createMockUserDocument = (overrides?: Partial<User>): any => {
  const user = createMockUser(overrides);
  return {
    ...user,
    comparePassword: jest.fn().mockResolvedValue(true),
    omitPassword: jest.fn().mockReturnValue({ ...user, password: undefined }),
    save: jest.fn().mockResolvedValue(user),
    toObject: jest.fn().mockReturnValue(user),
    _id: user._id,
  };
};

/**
 * Test constants
 */
export const TEST_CONSTANTS = {
  USER_ID: '507f1f77bcf86cd799439011',
  ACCOUNT_ID: '507f1f77bcf86cd799439012',
  REFRESH_TOKEN_ID: '507f1f77bcf86cd799439013',
  EMAIL: 'test@example.com',
  PASSWORD: 'TestPassword123!',
  VERIFICATION_CODE: '123456',
  RESET_CODE: '123456',
  JTI: 'test-jti-123',
  DEVICE_HASH: 'deviceHash123',
  ACCESS_TOKEN: 'mock-access-token',
  REFRESH_TOKEN: 'mock-refresh-token',
  RESET_TOKEN: 'mock-reset-token',
};
