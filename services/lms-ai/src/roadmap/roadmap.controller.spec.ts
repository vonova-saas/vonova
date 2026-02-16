import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';

describe('RoadmapController', () => {
  let controller: RoadmapController;
  let service: RoadmapService;

  const mockRoadmapService = {
    generateRoadmap: jest.fn(),
    getRoadmapById: jest.fn(),
    updateProgress: jest.fn(),
    deleteRoadmap: jest.fn(),
    getRoadmapHistory: jest.fn(),
    getServiceStats: jest.fn(),
    testAiConnection: jest.fn(),
    getSystemStatus: jest.fn(),
    bulkDeleteRoadmaps: jest.fn(),
    getQueryAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoadmapController],
      providers: [
        {
          provide: RoadmapService,
          useValue: mockRoadmapService,
        },
      ],
    }).compile();

    controller = module.get<RoadmapController>(RoadmapController);
    service = module.get<RoadmapService>(RoadmapService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.service).toBe('roadmap');
    });
  });

  describe('generateRoadmap', () => {
    it('should generate a roadmap', async () => {
      const dto = {
        topic: 'Machine Learning',
        skill_level: 'beginner' as const,
        duration_weeks: 12,
      };

      const mockResponse = {
        roadmapId: 'test-id',
        topic: 'Machine Learning',
        success: true,
      };

      mockRoadmapService.generateRoadmap.mockResolvedValue(mockResponse);

      const req = { userId: 'user-123' };
      const result = await controller.generateRoadmap(dto, req, '127.0.0.1', 'test-agent');

      expect(result).toBeDefined();
      expect(result.roadmapId).toBe('test-id');
      expect(service.generateRoadmap).toHaveBeenCalled();
    });
  });

  describe('getRoadmapById', () => {
    it('should get roadmap by id', async () => {
      const mockResponse = {
        roadmapId: 'test-id',
        topic: 'Test Topic',
        success: true,
      };

      mockRoadmapService.getRoadmapById.mockResolvedValue(mockResponse);

      const req = { userId: 'user-123' };
      const result = await controller.getRoadmapById('test-id', req, '127.0.0.1', 'test-agent');

      expect(result).toBeDefined();
      expect(service.getRoadmapById).toHaveBeenCalledWith('test-id', 'user-123', '127.0.0.1', 'test-agent');
    });
  });

  describe('updateProgress', () => {
    it('should update roadmap progress', async () => {
      const dto = {
        week_number: 1,
        progress_percentage: 25,
      };

      mockRoadmapService.updateProgress.mockResolvedValue(undefined);

      const req = { userId: 'user-123' };
      const result = await controller.updateProgress(
        'test-id',
        dto,
        req,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(true);
      expect(service.updateProgress).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user_id is missing', async () => {
      const dto = { week_number: 1 };
      const req = {};

      await expect(
        controller.updateProgress('test-id', dto, req, '127.0.0.1', 'test-agent')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteRoadmap', () => {
    it('should delete roadmap', async () => {
      mockRoadmapService.deleteRoadmap.mockResolvedValue({
        success: true,
        message: 'Roadmap deleted successfully',
      });

      const result = await controller.deleteRoadmap('test-id');

      expect(result.success).toBe(true);
      expect(service.deleteRoadmap).toHaveBeenCalledWith('test-id', undefined);
    });

    it('should throw BadRequestException when roadmap ID is empty', async () => {
      await expect(controller.deleteRoadmap('   ')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getServiceStats', () => {
    it('should return service statistics', async () => {
      const mockStats = {
        total_roadmaps: 10,
        total_generations: 50,
      };

      mockRoadmapService.getServiceStats.mockResolvedValue(mockStats);

      const result = await controller.getServiceStats();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

