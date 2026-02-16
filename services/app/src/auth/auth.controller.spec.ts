import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from './auth.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Account } from './schemas/account.schema';
import { RefreshToken } from './schemas/refresh-token.schema';
import { EmailVerification } from './schemas/email-verification.schema';
import { PasswordReset } from './schemas/password-reset.schema';
import {
  createMockUserDocument,
  TEST_CONSTANTS,
} from '../test-utils/test-helpers';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  };

  const mockAccountModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

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
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(getModelToken(User.name))
      .useValue(mockUserModel)
      .overrideProvider(getModelToken(Account.name))
      .useValue(mockAccountModel)
      .overrideProvider(getModelToken(RefreshToken.name))
      .useValue(mockRefreshTokenModel)
      .overrideProvider(getModelToken(EmailVerification.name))
      .useValue(mockEmailVerificationModel)
      .overrideProvider(getModelToken(PasswordReset.name))
      .useValue(mockPasswordResetModel)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api/v1');

    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        name: 'Test User',
        email: TEST_CONSTANTS.EMAIL,
        password: TEST_CONSTANTS.PASSWORD,
      };

      mockUserModel.findOne.mockResolvedValue(null);
      const mockUser = createMockUserDocument();
      mockUserModel.create.mockReturnValue({
        save: jest.fn().mockResolvedValue(mockUser),
        _id: TEST_CONSTANTS.USER_ID,
      });
      mockAccountModel.create.mockReturnValue({
        save: jest.fn().mockResolvedValue({}),
      });
      mockEmailVerificationModel.create.mockResolvedValue({});

      jest.spyOn(authService, 'registerUser').mockResolvedValue({
        message:
          'User registered successfully, you will receive a verification email.',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.message).toContain('User registered successfully');
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = {
        name: 'T', // Too short
        email: 'invalid-email',
        password: 'weak', // Too weak
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user successfully', async () => {
      const loginDto = {
        email: TEST_CONSTANTS.EMAIL,
        password: TEST_CONSTANTS.PASSWORD,
      };

      const mockUser = createMockUserDocument();
      jest.spyOn(authService, 'loginUserEmail').mockResolvedValue({
        user: mockUser,
        accessToken: TEST_CONSTANTS.ACCESS_TOKEN,
        refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.message).toContain('logged in successfully');
      expect(response.body.data.user).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: '',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      const verifyDto = {
        email: TEST_CONSTANTS.EMAIL,
        otp_code: TEST_CONSTANTS.VERIFICATION_CODE,
      };

      jest.spyOn(authService, 'verifyEmailCode').mockResolvedValue({
        message: 'Email verified successfully',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send(verifyDto)
        .expect(200);

      expect(response.body.message).toContain('Email verified successfully');
    });
  });

  describe('GET /api/v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      jest.spyOn(authService, 'refreshToken').mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${TEST_CONSTANTS.REFRESH_TOKEN}`)
        .expect(200);

      expect(response.body.message).toContain('Refreshed token successfully');
    });

    it('should return 401 if refresh token is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/refresh')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      jest.spyOn(authService, 'logout').mockResolvedValue({
        message: 'Logged out successfully',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', `refreshToken=${TEST_CONSTANTS.REFRESH_TOKEN}`)
        .expect(200);

      expect(response.body.message).toContain('Logged out successfully');
    });
  });

  describe('GET /api/v1/auth/currentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = createMockUserDocument();
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue({
        user: mockUser,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/currentUser')
        .set('Cookie', `accessToken=${TEST_CONSTANTS.ACCESS_TOKEN}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.message).toContain(
        'Current user fetched successfully',
      );
    });

    it('should return 401 if access token is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/currentUser')
        .expect(401);
    });
  });
});
