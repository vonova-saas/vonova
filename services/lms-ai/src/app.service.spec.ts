import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                PORT: '4005',
                ROADMAP_AI_SERVICE_URL: 'http://localhost:5000',
                PDF_SUMMARY_AI_SERVICE_URL: 'http://localhost:5015',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return app info', () => {
    const result = service.getAppInfo();
    expect(result).toBeDefined();
    expect(result.status).toBe('Healthy!');
  });
});
