import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from './auth.service';
import { User, UserDocument } from './schemas/user.schema';
import { Account, AccountDocument } from './schemas/account.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import {
  EmailVerification,
  EmailVerificationDocument,
} from './schemas/email-verification.schema';
import {
  PasswordReset,
  PasswordResetDocument,
} from './schemas/password-reset.schema';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@app/utils/appError';
import { Roles } from '../enums/role.enum';
import { ProviderEnum } from '../enums/account-provider.enum';
import {
  createMockUser,
  createMockUserDocument,
  createMockAccount,
  createMockRefreshToken,
  createMockEmailVerification,
  createMockPasswordReset,
  TEST_CONSTANTS,
} from '../test-utils/test-helpers';
import { EmailService } from './email.service';
import * as jwtUtils from '../utils/jwt';
import * as bcryptUtils from '../utils/bcrypt';

// Mock external dependencies
jest.mock('../utils/jwt');
jest.mock('../utils/bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<UserDocument>;
  let accountModel: Model<AccountDocument>;
  let refreshTokenModel: Model<RefreshTokenDocument>;
  let emailVerificationModel: Model<EmailVerificationDocument>;
  let passwordResetModel: Model<PasswordResetDocument>;

  // Helper to create a Mongoose query mock with .exec() method
  const createQueryMock = (result: any) => {
    const queryMock = {
      exec: jest.fn().mockResolvedValue(result),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
    };
    // Make select return the same mock so chaining works
    queryMock.select = jest.fn().mockReturnValue(queryMock);
    return queryMock;
  };

  // Create a constructor function for userModel
  const mockUserModel: any = jest.fn().mockImplementation((data) => {
    const mockUser = createMockUserDocument(data);
    return {
      ...mockUser,
      save: jest.fn().mockResolvedValue(mockUser),
    };
  });
  mockUserModel.findOne = jest.fn();
  mockUserModel.find = jest.fn();
  mockUserModel.create = jest.fn();
  mockUserModel.findById = jest.fn();
  mockUserModel.findByIdAndUpdate = jest.fn();
  mockUserModel.findOneAndUpdate = jest.fn();
  mockUserModel.findByIdAndDelete = jest.fn();
  mockUserModel.deleteOne = jest.fn();
  mockUserModel.deleteMany = jest.fn();

  // Create a constructor function for accountModel
  const mockAccountModel: any = jest.fn().mockImplementation((data) => {
    const mockAccount = createMockAccount(data);
    return {
      ...mockAccount,
      save: jest.fn().mockResolvedValue(mockAccount),
    };
  });
  mockAccountModel.findOne = jest.fn();
  mockAccountModel.create = jest.fn();

  const mockRefreshTokenModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockEmailVerificationModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockPasswordResetModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Account.name),
          useValue: mockAccountModel,
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshTokenModel,
        },
        {
          provide: getModelToken(EmailVerification.name),
          useValue: mockEmailVerificationModel,
        },
        {
          provide: getModelToken(PasswordReset.name),
          useValue: mockPasswordResetModel,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    accountModel = module.get<Model<AccountDocument>>(
      getModelToken(Account.name),
    );
    refreshTokenModel = module.get<Model<RefreshTokenDocument>>(
      getModelToken(RefreshToken.name),
    );
    emailVerificationModel = module.get<Model<EmailVerificationDocument>>(
      getModelToken(EmailVerification.name),
    );
    passwordResetModel = module.get<Model<PasswordResetDocument>>(
      getModelToken(PasswordReset.name),
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        name: 'Test User',
        email: TEST_CONSTANTS.EMAIL,
        password: TEST_CONSTANTS.PASSWORD,
      };

      mockUserModel.findOne.mockReturnValue(createQueryMock(null));
      const mockUser = createMockUserDocument();
      mockAccountModel.create.mockResolvedValue(createMockAccount());
      mockEmailVerificationModel.create.mockResolvedValue(
        createMockEmailVerification(),
      );
      const result = await service.registerUser(registerDto);

      expect(result.message).toContain('User registered successfully');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(mockEmailVerificationModel.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      const registerDto = {
        name: 'Test User',
        email: TEST_CONSTANTS.EMAIL,
        password: TEST_CONSTANTS.PASSWORD,
      };

      mockUserModel.findOne.mockReturnValue(createQueryMock(createMockUser()));

      await expect(service.registerUser(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
    });
  });

  describe('verifyEmailCode', () => {
    it('should verify email code successfully', async () => {
      const email = TEST_CONSTANTS.EMAIL;
      const code = TEST_CONSTANTS.VERIFICATION_CODE;

      const mockUser = createMockUserDocument({ isVerified: false });
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const mockVerification: any = {
        ...createMockEmailVerification({
          used: false,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockEmailVerificationModel.findOne.mockResolvedValue(mockVerification);

      const result = await service.verifyEmailCode(email, code);

      expect(result.message).toBe('Email verified successfully');
      expect(mockUser.isVerified).toBe(true);
      expect(mockVerification.used).toBe(true);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        service.verifyEmailCode(
          TEST_CONSTANTS.EMAIL,
          TEST_CONSTANTS.VERIFICATION_CODE,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if verification code is invalid', async () => {
      const mockUser = createMockUserDocument();
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockEmailVerificationModel.findOne.mockResolvedValue(null);

      await expect(
        service.verifyEmailCode(TEST_CONSTANTS.EMAIL, 'invalid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('loginUserEmail', () => {
    it('should login user successfully', async () => {
      const loginDto = {
        email: TEST_CONSTANTS.EMAIL,
        password: TEST_CONSTANTS.PASSWORD,
        userAgent: 'test-agent',
      };

      const mockUser = createMockUserDocument({
        email: TEST_CONSTANTS.EMAIL,
        isVerified: true,
        isActive: true,
        role: Roles.STUDENT_USER,
      });
      mockUser.comparePassword = jest.fn().mockResolvedValue(true);
      mockUser.omitPassword = jest
        .fn()
        .mockReturnValue({ ...mockUser, password: undefined });

      mockAccountModel.findOne.mockResolvedValue(createMockAccount());
      mockUserModel.findById.mockResolvedValue(mockUser);
      (bcryptUtils.generateDeviceHash as jest.Mock).mockReturnValue(
        TEST_CONSTANTS.DEVICE_HASH,
      );
      (jwtUtils.signJwtToken as jest.Mock)
        .mockReturnValueOnce(TEST_CONSTANTS.ACCESS_TOKEN)
        .mockReturnValueOnce(TEST_CONSTANTS.REFRESH_TOKEN);

      const mockRefreshToken = createMockRefreshToken();
      mockRefreshTokenModel.create.mockResolvedValue(mockRefreshToken);

      const result = await service.loginUserEmail(loginDto);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginDto.password);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockAccountModel.findOne.mockResolvedValue(null);

      await expect(
        service.loginUserEmail({
          email: TEST_CONSTANTS.EMAIL,
          password: TEST_CONSTANTS.PASSWORD,
          userAgent: 'test-agent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = createMockUserDocument();
      mockUser.comparePassword = jest.fn().mockResolvedValue(false);
      mockAccountModel.findOne.mockResolvedValue(createMockAccount());
      mockUserModel.findById.mockResolvedValue(mockUser);

      await expect(
        service.loginUserEmail({
          email: TEST_CONSTANTS.EMAIL,
          password: 'wrong-password',
          userAgent: 'test-agent',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = TEST_CONSTANTS.REFRESH_TOKEN;
      const userAgent = 'test-agent';

      (jwtUtils.verifyJwtToken as jest.Mock).mockReturnValue({
        payload: {
          jti: TEST_CONSTANTS.JTI,
          userId: TEST_CONSTANTS.USER_ID,
          role: Roles.STUDENT_USER,
        },
      });

      const mockRefreshTokenDoc = createMockRefreshToken({
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      mockRefreshTokenModel.findOne.mockResolvedValue(mockRefreshTokenDoc);

      const mockUser = createMockUserDocument();
      mockUserModel.findById.mockResolvedValue(mockUser);

      (jwtUtils.signJwtToken as jest.Mock)
        .mockReturnValueOnce(TEST_CONSTANTS.ACCESS_TOKEN)
        .mockReturnValueOnce('new-refresh-token');
      (bcryptUtils.generateDeviceHash as jest.Mock).mockReturnValue(
        TEST_CONSTANTS.DEVICE_HASH,
      );

      const newRefreshToken = createMockRefreshToken();
      mockRefreshTokenModel.create.mockResolvedValue(newRefreshToken);
      mockRefreshTokenModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.refreshToken(refreshToken, userAgent);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      (jwtUtils.verifyJwtToken as jest.Mock).mockReturnValue({
        payload: null,
        error: 'Invalid token',
      });

      await expect(
        service.refreshToken('invalid-token', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestResetPassword', () => {
    it('should request password reset successfully', async () => {
      const email = TEST_CONSTANTS.EMAIL;
      const mockUser = createMockUserDocument();
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const mockPasswordReset = createMockPasswordReset();
      mockPasswordResetModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
      mockPasswordResetModel.create.mockResolvedValue(mockPasswordReset);
      const result = await service.requestResetPassword(email);

      expect(result.message).toContain(
        'A reset code has been sent successfully',
      );
      expect(mockPasswordResetModel.create).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        service.requestResetPassword(TEST_CONSTANTS.EMAIL),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyResetPasswordCode', () => {
    it('should verify reset code successfully', async () => {
      const email = TEST_CONSTANTS.EMAIL;
      const code = TEST_CONSTANTS.RESET_CODE;

      const mockUser = createMockUserDocument();
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const mockPasswordReset: any = {
        ...createMockPasswordReset({
          used: false,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        }),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetModel.findOne.mockResolvedValue(mockPasswordReset);
      (jwtUtils.signJwtToken as jest.Mock).mockReturnValue(
        TEST_CONSTANTS.RESET_TOKEN,
      );

      const result = await service.verifyResetPasswordCode(email, code);

      expect(result.resetToken).toBeDefined();
      expect(result.message).toContain('Reset code verified');
    });

    it('should throw BadRequestException if reset code is invalid', async () => {
      const mockUser = createMockUserDocument();
      mockUserModel.findOne.mockReturnValue(createQueryMock(mockUser));
      mockPasswordResetModel.findOne.mockResolvedValue(null);

      await expect(
        service.verifyResetPasswordCode(TEST_CONSTANTS.EMAIL, 'invalid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetToken = TEST_CONSTANTS.RESET_TOKEN;
      const email = TEST_CONSTANTS.EMAIL;
      const newPassword = 'NewPassword123!';

      (jwtUtils.verifyJwtToken as jest.Mock).mockReturnValue({
        payload: {
          userId: TEST_CONSTANTS.USER_ID,
          role: '',
        },
      });

      const mockUser = createMockUserDocument();
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUser.save = jest.fn().mockResolvedValue(mockUser);

      const mockPasswordReset: any = {
        ...createMockPasswordReset(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockPasswordResetModel.findOne.mockResolvedValue(mockPasswordReset);

      const result = await service.resetPassword(
        resetToken,
        email,
        newPassword,
      );

      expect(result.message).toContain('Password reset successfully');
      expect(mockUser.save).toHaveBeenCalled();
      expect(
        mockEmailService.sendPasswordResetConfirmationEmail,
      ).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if reset token is invalid', async () => {
      (jwtUtils.verifyJwtToken as jest.Mock).mockReturnValue({
        payload: null,
      });

      await expect(
        service.resetPassword(
          'invalid-token',
          TEST_CONSTANTS.EMAIL,
          'NewPassword123!',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if email does not match token user', async () => {
      (jwtUtils.verifyJwtToken as jest.Mock).mockReturnValue({
        payload: {
          userId: TEST_CONSTANTS.USER_ID,
          role: '',
        },
      });

      const mockUser = createMockUserDocument();
      mockUserModel.findById.mockResolvedValue(mockUser);

      await expect(
        service.resetPassword(
          TEST_CONSTANTS.RESET_TOKEN,
          'different@email.com',
          'NewPassword123!',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const refreshToken = TEST_CONSTANTS.REFRESH_TOKEN;
      const userAgent = 'test-agent';

      (jwtUtils.verifyJwtToken as jest.Mock).mockReturnValue({
        payload: {
          jti: TEST_CONSTANTS.JTI,
          userId: TEST_CONSTANTS.USER_ID,
          role: Roles.STUDENT_USER,
        },
      });

      const mockRefreshTokenDoc = createMockRefreshToken();
      mockRefreshTokenModel.findOne.mockResolvedValue(mockRefreshTokenDoc);
      mockRefreshTokenModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
      (bcryptUtils.generateDeviceHash as jest.Mock).mockReturnValue(
        TEST_CONSTANTS.DEVICE_HASH,
      );

      const result = await service.logout(refreshToken, userAgent);

      expect(result.message).toContain('Logged out successfully');
      expect(mockRefreshTokenModel.deleteOne).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const accessToken = TEST_CONSTANTS.ACCESS_TOKEN;

      (jwtUtils.verifyJwtToken as jest.Mock).mockReturnValue({
        payload: {
          userId: TEST_CONSTANTS.USER_ID,
          role: Roles.STUDENT_USER,
        },
      });

      const mockUser = createMockUserDocument();
      mockUserModel.findById.mockReturnValue(createQueryMock(mockUser));

      const result = await service.getCurrentUser(accessToken);

      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined();
    });

    it('should throw UnauthorizedException if access token is invalid', async () => {
      (jwtUtils.verifyJwtToken as jest.Mock).mockReturnValue({
        payload: null,
        error: 'Invalid token',
      });

      await expect(service.getCurrentUser('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
