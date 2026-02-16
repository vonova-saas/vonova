import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                ROADMAP_AI_SERVICE_URL: 'http://localhost:5000',
                PDF_SUMMARY_AI_SERVICE_URL: 'http://localhost:5015',
                NODE_ENV: 'test',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverallHealth', () => {
    it('should return healthy status when all services are healthy', async () => {
      const result = await service.getOverallHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe('healthy');
      expect(result.services).toBeDefined();
      expect(result.services.backend).toBe('healthy');
      expect(result.services.roadmap_ai).toBe('healthy');
      expect(result.services.pdf_summary_ai).toBe('healthy');
      expect(result.services.database).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.memory).toBeDefined();
    });

    it('should return degraded status when AI services are unhealthy', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'ROADMAP_AI_SERVICE_URL' || key === 'PDF_SUMMARY_AI_SERVICE_URL') {
          return undefined;
        }
        return 'test';
      });

      const result = await service.getOverallHealth();

      expect(result.status).toBe('degraded');
      expect(result.services.roadmap_ai).toBe('unhealthy');
      expect(result.services.pdf_summary_ai).toBe('unhealthy');
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(service as any, 'checkRoadmapAiHealth').mockRejectedValue(new Error('Connection failed'));

      const result = await service.getOverallHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBeDefined();
    });
  });
});

