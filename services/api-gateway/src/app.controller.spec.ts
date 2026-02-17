/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('AppController', () => {
  let appController: AppController;
  let mockNatsClient: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    // Create a mock for NATS client
    mockNatsClient = {
      send: jest.fn(),
    } as any;

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: 'NATS_SERVICE',
          useValue: mockNatsClient,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return health check with correct structure', () => {
      const result = appController.getHealth();

      expect(result).toEqual({
        status: 'Healthy!',
        service: 'API Gateway Service',
        version: '1.0.0',
        timestamp: expect.any(String),
      });
    });

    it('should return current timestamp in ISO format', () => {
      const result = appController.getHealth() as { timestamp: string };

      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      expect(() => new Date(result.timestamp)).not.toThrow();
    });
  });

  describe('getAppHealth', () => {
    it('should call NATS client with correct parameters', () => {
      const mockResponse = of({ status: 'ok' });
      mockNatsClient.send.mockReturnValue(mockResponse);

      const result = appController.getAppHealth();

      expect(mockNatsClient.send).toHaveBeenCalledWith(
        { cmd: 'getAppHealth' },
        {},
      );
      expect(result).toBe(mockResponse);
    });

    it('should handle NATS client errors gracefully', () => {
      const mockError = new Error('NATS connection failed');
      mockNatsClient.send.mockImplementation(() => {
        throw mockError;
      });

      expect(() => appController.getAppHealth()).toThrow(
        'NATS connection failed',
      );
    });

    it('should return observable from NATS client', () => {
      const mockObservable = of({ status: 'ok' });
      mockNatsClient.send.mockReturnValue(mockObservable);

      const result = appController.getAppHealth();

      expect(mockNatsClient.send).toHaveBeenCalledWith(
        { cmd: 'getAppHealth' },
        {},
      );
      expect(result).toBe(mockObservable);
    });
  });

  describe('controller initialization', () => {
    it('should be properly instantiated with NATS client', () => {
      expect(appController).toBeDefined();
      expect(appController).toBeInstanceOf(AppController);
    });
  });
});
