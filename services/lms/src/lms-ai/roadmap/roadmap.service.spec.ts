import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { RoadmapRepository } from '../database/repositories/roadmap.repository';
import { RoadmapHistoryRepository } from '../database/repositories/roadmap-history.repository';

describe('RoadmapService', () => {
  let service: RoadmapService;
  let roadmapRepository: jest.Mocked<RoadmapRepository>;
  let roadmapHistoryRepository: jest.Mocked<RoadmapHistoryRepository>;
  let configService: jest.Mocked<ConfigService>;

  const mockRoadmapRepository = {
    findById: jest.fn(),
    findSimilar: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    deleteById: jest.fn(),
    // Stats helpers
    getTotalCount: jest.fn(),
    getActiveRoadmapsCount: jest.fn(),
    getAverageGenerationTime: jest.fn(),
    getRoadmapsByStatus: jest.fn(),
  } as unknown as jest.Mocked<RoadmapRepository>;

  const mockRoadmapHistoryRepository = {
    create: jest.fn(),
    findByRoadmapId: jest.fn(),
    // Stats helper
    getTotalCount: jest.fn(),
  } as unknown as jest.Mocked<RoadmapHistoryRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapService,
        {
          provide: RoadmapRepository,
          useValue: mockRoadmapRepository,
        },
        {
          provide: RoadmapHistoryRepository,
          useValue: mockRoadmapHistoryRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                ROADMAP_AI_SERVICE_URL: 'http://localhost:5000',
                FALLBACK_ROADMAP_AI_SERVICE_URL: undefined,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RoadmapService>(RoadmapService);
    roadmapRepository = module.get(RoadmapRepository);
    roadmapHistoryRepository = module.get(RoadmapHistoryRepository);
    configService = module.get(ConfigService);

    // Mock global fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRoadmap', () => {
    const validRequest = {
      topic: 'Machine Learning',
      skill_level: 'beginner' as const,
      duration_weeks: 12,
      userId: 'user-123',
    };

    it('should throw BadRequestException for missing topic', async () => {
      await expect(
        service.generateRoadmap({ ...validRequest, topic: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid skill level', async () => {
      await expect(
        service.generateRoadmap({
          ...validRequest,
          skill_level: 'invalid' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid duration', async () => {
      await expect(
        service.generateRoadmap({ ...validRequest, duration_weeks: 0 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.generateRoadmap({ ...validRequest, duration_weeks: 53 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for too many focus areas', async () => {
      await expect(
        service.generateRoadmap({
          ...validRequest,
          focus_areas: Array(11).fill('area'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use cached roadmap if similar exists', async () => {
      const cachedRoadmap = {
        toObject: () => ({
          roadmapId: 'cached-id',
          topic: 'Machine Learning',
          skill_level: 'beginner',
          duration_weeks: 12,
          userId: 'user-123',
          weeks: [],
          overview: 'Test overview',
          created_at: new Date(),
        }),
        userId: { toString: () => 'user-123' },
      };

      roadmapRepository.findSimilar.mockResolvedValue([cachedRoadmap] as any);
      roadmapHistoryRepository.create.mockResolvedValue(undefined as any);

      const result = await service.generateRoadmap(validRequest);

      expect(result).toBeDefined();
      expect(result.roadmapId).toBe('cached-id');
      expect(roadmapRepository.findSimilar).toHaveBeenCalled();
    });
  });

  describe('getRoadmapById', () => {
    it('should return roadmap when found', async () => {
      const roadmap = {
        toObject: () => ({
          roadmapId: 'test-id',
          topic: 'Test Topic',
          title: 'Test Topic',
          userId: 'user-123',
          weeks: [],
          overview: 'Test overview',
          created_at: new Date(),
        }),
        userId: { toString: () => 'user-123' },
      };

      roadmapRepository.findById.mockResolvedValue(roadmap as any);
      roadmapHistoryRepository.create.mockResolvedValue(undefined as any);

      const result = await service.getRoadmapById('test-id', 'user-123');

      expect(result).toBeDefined();
      expect(result.roadmapId).toBe('test-id');
      expect(roadmapRepository.findById).toHaveBeenCalledWith('test-id');
    });

    it('should throw BadRequestException when roadmap not found', async () => {
      roadmapRepository.findById.mockResolvedValue(null);

      await expect(service.getRoadmapById('non-existent-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateProgress', () => {
    it('should throw BadRequestException when roadmap not found', async () => {
      roadmapRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateProgress('non-existent-id', 'user-123', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update roadmap status to completed when progress is 100%', async () => {
      const roadmap = {
        toObject: () => ({}),
        userId: 'user-123',
      };

      roadmapRepository.findById.mockResolvedValue(roadmap as any);
      roadmapRepository.updateStatus.mockResolvedValue(undefined);
      roadmapHistoryRepository.create.mockResolvedValue(undefined as any);

      await service.updateProgress(
        'test-id',
        'user-123',
        undefined,
        undefined,
        100,
      );

      expect(roadmapRepository.updateStatus).toHaveBeenCalledWith(
        'test-id',
        'completed',
      );
    });

    it('should update roadmap status to in_progress when progress > 0', async () => {
      const roadmap = {
        toObject: () => ({}),
        userId: 'user-123',
      };

      roadmapRepository.findById.mockResolvedValue(roadmap as any);
      roadmapRepository.updateStatus.mockResolvedValue(undefined);
      roadmapHistoryRepository.create.mockResolvedValue(undefined as any);

      await service.updateProgress(
        'test-id',
        'user-123',
        undefined,
        undefined,
        50,
      );

      expect(roadmapRepository.updateStatus).toHaveBeenCalledWith(
        'test-id',
        'in_progress',
      );
    });
  });

  describe('getServiceStats', () => {
    it('should return service statistics', async () => {
      roadmapRepository.getTotalCount.mockResolvedValue(10);
      roadmapHistoryRepository.getTotalCount.mockResolvedValue(50);
      roadmapRepository.getActiveRoadmapsCount.mockResolvedValue(3);
      roadmapRepository.getAverageGenerationTime.mockResolvedValue(1200);
      roadmapRepository.getRoadmapsByStatus.mockResolvedValue({
        generated: 5,
        in_progress: 3,
        completed: 2,
      });

      const result = await service.getServiceStats();

      expect(result).toBeDefined();
      expect(result.total_roadmaps).toBe(10);
      expect(result.total_generations).toBe(50);
      expect(result.active_roadmaps).toBe(3);
      expect(result.roadmaps_by_status.generated).toBe(5);
    });
  });
});
