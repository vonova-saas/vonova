/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationService } from './notification.service';
import {
  Notification,
  NotificationDocument,
} from './schema/notification.schema';
import { EmailSenderService } from './email-sender.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationModel: jest.Mocked<Model<NotificationDocument>> &
    jest.Mock<any, any>;
  let emailSender: jest.Mocked<EmailSenderService>;

  beforeEach(async () => {
    const notificationModelMock = jest.fn().mockImplementation(() => ({
      save: jest.fn(),
    })) as unknown as jest.Mocked<Model<NotificationDocument>> &
      jest.Mock<any, any>;

    // Attach query methods used in tests
    (notificationModelMock as any).find = jest.fn();
    (notificationModelMock as any).sort = jest.fn();
    (notificationModelMock as any).exec = jest.fn();
    (notificationModelMock as any).updateOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken(Notification.name),
          useValue: notificationModelMock,
        },
        {
          provide: EmailSenderService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationModel = module.get(getModelToken(Notification.name));
    emailSender = module.get(EmailSenderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sendEmailVerification should call EmailSenderService with correct payload', async () => {
    await service.sendEmailVerification({
      email: 'test@example.com',
      name: 'Test User',
      code: '123456',
    });

    expect(emailSender.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('Verify your email address'),
        html: expect.stringContaining('123456'),
      }),
    );
  });

  it('sendPasswordResetCode should call EmailSenderService with correct payload', async () => {
    await service.sendPasswordResetCode({
      email: 'reset@example.com',
      name: 'Reset User',
      code: '654321',
    });

    expect(emailSender.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'reset@example.com',
        subject: expect.stringContaining('Password reset code'),
        html: expect.stringContaining('654321'),
      }),
    );
  });

  it('sendWelcomeEmail should call EmailSenderService with correct payload', async () => {
    await service.sendWelcomeEmail({
      email: 'welcome@example.com',
      name: 'Welcome User',
      role: 'USER',
    });

    expect(emailSender.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'welcome@example.com',
        subject: expect.stringContaining('Welcome to Vonova'),
        html: expect.stringContaining('Welcome User'),
      }),
    );
  });

  it('createInAppNotification should create and save a notification', async () => {
    const saveMock = jest.fn().mockResolvedValue({ _id: 'notif-id' });
    (notificationModel as jest.Mock).mockImplementation(() => ({
      save: saveMock,
    }));

    const result = await service.createInAppNotification({
      userId: new Types.ObjectId().toHexString(),
      title: 'Title',
      message: 'Message',
      type: 'system',
      data: { foo: 'bar' },
    });

    expect(saveMock).toHaveBeenCalled();
    expect(result).toEqual({ _id: 'notif-id' });
  });

  it('listUserNotifications should query notifications by userId', async () => {
    const execMock = jest.fn().mockResolvedValue([]);
    const sortMock = jest.fn().mockReturnValue({ exec: execMock });
    notificationModel.find = jest
      .fn()
      .mockReturnValue({ sort: sortMock } as never);

    const userId = new Types.ObjectId().toHexString();
    const result = await service.listUserNotifications(userId);

    expect(notificationModel.find).toHaveBeenCalledWith({
      userId: expect.any(Types.ObjectId),
    });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(execMock).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('markAsRead should update notification isRead flag', async () => {
    const execMock = jest.fn().mockResolvedValue(undefined);
    notificationModel.updateOne = jest
      .fn()
      .mockReturnValue({ exec: execMock } as never);

    const id = new Types.ObjectId().toHexString();
    await service.markAsRead(id);

    expect(notificationModel.updateOne).toHaveBeenCalledWith(
      { _id: expect.any(Types.ObjectId) },
      { $set: { isRead: true } },
    );
    expect(execMock).toHaveBeenCalled();
  });
});
