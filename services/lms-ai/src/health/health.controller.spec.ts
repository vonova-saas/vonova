import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            getOverallHealth: jest.fn().mockResolvedValue({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              services: {
                backend: 'healthy',
                roadmap_ai: 'healthy',
                pdf_summary_ai: 'healthy',
                database: 'healthy',
              },
              uptime: 100,
              memory: { heapUsed: 1000000 },
              environment: 'test',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return overall health status', async () => {
    const result = await controller.getOverallHealth();

    expect(result).toBeDefined();
    expect(result.status).toBe('healthy');
    expect(result.services).toBeDefined();
    expect(service.getOverallHealth).toHaveBeenCalled();
  });
});

