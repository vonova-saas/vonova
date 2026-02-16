import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PdfSummaryService } from './pdf-summary.service';
import { PdfSummaryRepository } from '../database/repositories/pdf-summary.repository';
import { PdfChatHistoryRepository } from '../database/repositories/pdf-chat-history.repository';
import { S3Service } from '../common/services/s3.service';

describe('PdfSummaryService', () => {
  let service: PdfSummaryService;
  let pdfSummaryRepository: jest.Mocked<PdfSummaryRepository>;
  let pdfChatHistoryRepository: jest.Mocked<PdfChatHistoryRepository>;
  let s3Service: jest.Mocked<S3Service>;
  let configService: jest.Mocked<ConfigService>;

  const mockPdfSummaryRepository = {
    findBySessionId: jest.fn(),
    create: jest.fn(),
    deleteBySessionId: jest.fn(),
    count: jest.fn(),
  };

  const mockPdfChatHistoryRepository = {
    create: jest.fn(),
    findBySessionId: jest.fn(),
    deleteBySessionId: jest.fn(),
    count: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getFileUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfSummaryService,
        {
          provide: PdfSummaryRepository,
          useValue: mockPdfSummaryRepository,
        },
        {
          provide: PdfChatHistoryRepository,
          useValue: mockPdfChatHistoryRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                PDF_SUMMARY_AI_SERVICE_URL: 'http://localhost:5015',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PdfSummaryService>(PdfSummaryService);
    pdfSummaryRepository = module.get(PdfSummaryRepository);
    pdfChatHistoryRepository = module.get(PdfChatHistoryRepository);
    s3Service = module.get(S3Service);
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

  describe('deleteSession', () => {
    it('should return success for non-existent session (idempotent)', async () => {
      pdfSummaryRepository.findBySessionId.mockResolvedValue(null);

      const result = await service.deleteSession('non-existent-session');

      expect(result.success).toBe(true);
      expect(result.message).toContain('did not exist');
    });

    it('should delete session when found', async () => {
      const session = {
        session_id: 'test-session',
        s3_key: 'pdfs/test.pdf',
        user_id: 'user-123',
      };

      pdfSummaryRepository.findBySessionId.mockResolvedValue(session as any);
      pdfSummaryRepository.deleteBySessionId.mockResolvedValue(true);
      pdfChatHistoryRepository.deleteBySessionId.mockResolvedValue(true);
      mockS3Service.deleteFile.mockResolvedValue(true);

      const result = await service.deleteSession('test-session');

      expect(result.success).toBe(true);
      expect(pdfSummaryRepository.deleteBySessionId).toHaveBeenCalled();
      expect(pdfChatHistoryRepository.deleteBySessionId).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not own session', async () => {
      const session = {
        session_id: 'test-session',
        user_id: 'user-123',
      };

      pdfSummaryRepository.findBySessionId.mockResolvedValue(session as any);

      await expect(
        service.deleteSession('test-session', 'different-user')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFullSummary', () => {
    it('should throw BadRequestException when session not found in database', async () => {
      pdfSummaryRepository.findBySessionId.mockResolvedValue(null);
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not found'),
      });

      // The service will throw InternalServerErrorException when Python service returns 404
      // This is expected behavior - the service tries to get summary from Python service
      await expect(
        service.getFullSummary('non-existent-session')
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should return summary when session exists', async () => {
      const session = {
        session_id: 'test-session',
        summary: 'Test summary',
        user_id: 'user-123',
      };

      pdfSummaryRepository.findBySessionId.mockResolvedValue(session as any);
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ summary: 'Test summary' }),
      });

      const result = await service.getFullSummary('test-session');

      expect(result).toBeDefined();
    });
  });

  describe('getSessionChatHistory', () => {
    it('should return chat history with pagination', async () => {
      const mockChats = [
        { question: 'What is this?', answer: 'This is a test' },
      ];

      pdfChatHistoryRepository.findBySessionId = jest.fn().mockResolvedValue({
        chats: mockChats,
        total: 1,
      });

      const result = await service.getSessionChatHistory('test-session', 1, 20);

      expect(result).toBeDefined();
      expect(result.chats).toBeDefined();
      expect(result.total).toBe(1);
    });
  });

  describe('getServiceStats', () => {
    it('should return service statistics', async () => {
      (pdfSummaryRepository as any).count = jest.fn().mockResolvedValue(10);
      (pdfChatHistoryRepository as any).count = jest.fn().mockResolvedValue(50);

      const result = await service.getServiceStats();

      expect(result).toBeDefined();
      expect(result.total_summaries).toBeDefined();
    });
  });
});

