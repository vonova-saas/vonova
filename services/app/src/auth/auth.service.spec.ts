/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { User } from './schema/user.schema';
import { Account } from './schema/account.schema';
import { RefreshToken } from './schema/refreshToken.schema';
import { EmailVerification } from './schema/emailVerification.schema';
import { PasswordReset } from './schema/passwordReset.schema';
import { WaitlistService } from '../waitlist/waitlist.service';
import { NotificationService } from '../notification/notification.service';

describe('AuthService', () => {
  let service: AuthService;

  const userModelMock = {
    findOne: jest.fn(),
    create: jest.fn(),
  } as any;

  const accountModelMock = {} as any;
  const refreshTokenModelMock = {} as any;
  const emailVerificationModelMock = {
    create: jest.fn(),
  } as any;
  const passwordResetModelMock = {} as any;
  const waitlistServiceMock = {} as any;
  const notificationServiceMock = {} as any;

  const jwtServiceMock = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn(),
  } as Partial<JwtService> as JwtService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: getModelToken(Account.name), useValue: accountModelMock },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: refreshTokenModelMock,
        },
        {
          provide: getModelToken(EmailVerification.name),
          useValue: emailVerificationModelMock,
        },
        {
          provide: getModelToken(PasswordReset.name),
          useValue: passwordResetModelMock,
        },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: WaitlistService, useValue: waitlistServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('register should throw RpcException if email already exists', async () => {
    userModelMock.findOne.mockReturnValueOnce({
      exec: () => Promise.resolve({}),
    });

    await expect(
      service.register({
        name: 'Test',
        email: 'test@example.com',
        password: 'password',
      } as any),
    ).rejects.toBeInstanceOf(RpcException);
  });
});
