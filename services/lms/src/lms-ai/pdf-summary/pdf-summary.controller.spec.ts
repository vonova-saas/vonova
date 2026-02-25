import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PdfSummaryController } from './pdf-summary.controller';
import { PdfSummaryService } from './pdf-summary.service';

describe('PdfSummaryController', () => {
  let controller: PdfSummaryController;
  let service: PdfSummaryService;

  const mockPdfSummaryService = {
    uploadPDF: jest.fn(),
    chatWithPDF: jest.fn(),
    getFullSummary: jest.fn(),
    getSessionChatHistory: jest.fn(),
    rateChatResponse: jest.fn(),
    deleteSession: jest.fn(),
    bulkDeleteSessions: jest.fn(),
    getServiceStats: jest.fn(),
    getQueryAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfSummaryController],
      providers: [
        {
          provide: PdfSummaryService,
          useValue: mockPdfSummaryService,
        },
      ],
    }).compile();

    controller = module.get<PdfSummaryController>(PdfSummaryController);
    service = module.get<PdfSummaryService>(PdfSummaryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return health status', () => {
      const result = controller.healthCheck();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.service).toBe('pdf-summary');
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      mockPdfSummaryService.deleteSession.mockResolvedValue({
        success: true,
        message: 'Session deleted successfully',
      });

      await controller.deleteSession('test-session-id');

      expect(service.deleteSession).toHaveBeenCalledWith('test-session-id', undefined);
    });

    it('should throw BadRequestException when session ID is empty', async () => {
      await expect(controller.deleteSession('   ')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFullSummary', () => {
    it('should return full summary', async () => {
      const mockSummary = {
        session_id: 'test-session',
        summary: 'Test summary',
        success: true,
      };

      mockPdfSummaryService.getFullSummary.mockResolvedValue(mockSummary);

      const req = {};
      const result = await controller.getFullSummary('test-session', req, '127.0.0.1', 'test-agent');

      expect(result).toBeDefined();
      expect(service.getFullSummary).toHaveBeenCalled();
    });
  });

  describe('getSessionChatHistory', () => {
    it('should return chat history', async () => {
      const mockHistory = {
        chats: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };

      mockPdfSummaryService.getSessionChatHistory.mockResolvedValue(mockHistory);

      const result = await controller.getSessionChatHistory('test-session', 'test-session', '1', '20');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should throw BadRequestException when sessionId is missing', async () => {
      await expect(
        controller.getSessionChatHistory('', undefined, '1', '20')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkDeleteSessions', () => {
    it('should bulk delete sessions', async () => {
      const dto = {
        session_ids: ['session-1', 'session-2'],
      };

      mockPdfSummaryService.bulkDeleteSessions.mockResolvedValue({
        total_requested: 2,
        deleted: 2,
        failed: 0,
        failed_session_ids: [],
      });

      const result = await controller.bulkDeleteSessions(dto);

      expect(result.success).toBe(true);
      expect(service.bulkDeleteSessions).toHaveBeenCalled();
    });
  });

  describe('getServiceStats', () => {
    it('should return service statistics', async () => {
      const mockStats = {
        total_summaries: 10,
        total_chats: 50,
      };

      mockPdfSummaryService.getServiceStats.mockResolvedValue(mockStats);

      const result = await controller.getServiceStats();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

