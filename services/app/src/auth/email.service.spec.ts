import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

// Mock Nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let mockSendMail: jest.Mock;
  let mockCreateTransport: jest.Mock;

  beforeEach(async () => {
    mockSendMail = jest.fn();
    mockCreateTransport = jest.fn().mockReturnValue({
      sendMail: mockSendMail,
    });

    (nodemailer.createTransport as jest.Mock) = mockCreateTransport;

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'env.emailHost': 'smtp.example.com',
          'env.emailPort': 465,
          'env.emailSecure': true,
          'env.emailUser': 'test@example.com',
          'env.emailPassword': 'password123',
          'env.emailFrom': 'noreply@vonova.tech',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const email = 'test@example.com';
      const code = '123456';

      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        accepted: [email],
        rejected: [],
      });

      await service.sendVerificationEmail(email, code);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@vonova.tech',
        to: email,
        subject: 'Verify Your Email - Onyx',
        html: expect.stringContaining(code),
        text: expect.stringContaining(code),
      });
    });

    it('should handle email sending errors gracefully', async () => {
      const email = 'test@example.com';
      const code = '123456';

      mockSendMail.mockRejectedValue(new Error('Email service error'));

      // Should throw error as the service throws on error
      await expect(service.sendVerificationEmail(email, code)).rejects.toThrow(
        'Failed to send email',
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const email = 'test@example.com';
      const code = '123456';

      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        accepted: [email],
        rejected: [],
      });

      await service.sendPasswordResetEmail(email, code);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@vonova.tech',
        to: email,
        subject: 'Password Reset Request - Onyx',
        html: expect.stringContaining(code),
        text: expect.stringContaining(code),
      });
    });
  });

  describe('sendPasswordResetConfirmationEmail', () => {
    it('should send password reset confirmation email successfully', async () => {
      const email = 'test@example.com';

      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        accepted: [email],
        rejected: [],
      });

      await service.sendPasswordResetConfirmationEmail(email);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@vonova.tech',
        to: email,
        subject: 'Your Onyx Password Has Been Reset',
        html: expect.stringContaining('successfully reset'),
        text: expect.stringContaining('successfully reset'),
      });
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';

      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        accepted: [email],
        rejected: [],
      });

      await service.sendWelcomeEmail(email, name);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@vonova.tech',
        to: email,
        subject: 'Welcome to Onyx!',
        html: expect.stringContaining(name),
        text: expect.stringContaining(name),
      });
    });
  });
});
