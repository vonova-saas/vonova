/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            sendEmailVerification: jest.fn(),
            sendPasswordResetCode: jest.fn(),
            sendWelcomeEmail: jest.fn(),
            createInAppNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('handleEmailVerification should delegate to NotificationService', () => {
    const payload = {
      email: 'test@example.com',
      name: 'User',
      code: '123456',
    };

    controller.handleEmailVerification(payload as any);

    expect(service.sendEmailVerification).toHaveBeenCalledWith(payload);
  });

  it('handlePasswordResetRequested should delegate to NotificationService', () => {
    const payload = {
      email: 'reset@example.com',
      name: 'User',
      code: '654321',
    };

    controller.handlePasswordResetRequested(payload as any);

    expect(service.sendPasswordResetCode).toHaveBeenCalledWith(payload);
  });

  it('handleWelcomeEmail should delegate to NotificationService', () => {
    const payload = {
      email: 'welcome@example.com',
      name: 'User',
      role: 'USER',
    };

    controller.handleWelcomeEmail(payload as any);

    expect(service.sendWelcomeEmail).toHaveBeenCalledWith(payload);
  });

  it('handleGenericInApp should call createInAppNotification and return its result', async () => {
    const payload = {
      userId: 'user-id',
      title: 'Title',
      message: 'Message',
      type: 'system',
      data: { foo: 'bar' },
    };

    const created = { _id: 'notif-id', ...payload };
    (service.createInAppNotification as jest.Mock).mockResolvedValue(created);

    const result = await controller.handleGenericInApp(payload as any);

    expect(service.createInAppNotification).toHaveBeenCalledWith(payload);
    expect(result).toEqual(created);
  });
});
