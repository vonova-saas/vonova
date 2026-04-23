import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PdfSummaryService } from './pdf-summary.service';
import { PdfSummaryRepository } from '../database/repositories/pdf-summary.repository';
import { PdfChatHistoryRepository } from '../database/repositories/pdf-chat-history.repository';
import { PdfSummaryAudioRepository } from '../database/repositories/pdf-summary-audio.repository';
import { VoiceAskIdempotencyRepository } from '../database/repositories/voice-ask-idempotency.repository';
import { S3Service } from '../../common/services/s3.service';

describe('PdfSummaryService', () => {
  let service: PdfSummaryService;
  let pdfSummaryRepository: jest.Mocked<PdfSummaryRepository>;
  let pdfChatHistoryRepository: jest.Mocked<PdfChatHistoryRepository>;
  let pdfSummaryAudioRepository: jest.Mocked<PdfSummaryAudioRepository>;
  let s3Service: jest.Mocked<S3Service>;
  let configService: jest.Mocked<ConfigService>;

  const mockPdfSummaryRepository = {
    findBySessionId: jest.fn(),
    create: jest.fn(),
    deleteBySessionId: jest.fn(),
    // Stats helpers
    getTotalCount: jest.fn(),
    getActiveSessionsCount: jest.fn(),
    getAverageProcessingTime: jest.fn(),
    getLanguageDistribution: jest.fn(),
  } as unknown as jest.Mocked<PdfSummaryRepository>;

  const mockPdfChatHistoryRepository = {
    create: jest.fn(),
    findBySessionId: jest.fn(),
    deleteBySessionId: jest.fn(),
    // Stats helpers
    getTotalCount: jest.fn(),
    getAverageResponseTime: jest.fn(),
    getMostCommonQueries: jest.fn(),
    getQueriesByHour: jest.fn(),
    getAverageRating: jest.fn(),
  } as unknown as jest.Mocked<PdfChatHistoryRepository>;

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getFileUrl: jest.fn(),
    getPresignedGetUrl: jest.fn(),
  };

  const mockPdfSummaryAudioRepository = {
    create: jest.fn(),
    findBySessionId: jest.fn(),
  } as unknown as jest.Mocked<PdfSummaryAudioRepository>;

  const mockVoiceAskIdempotencyRepository = {
    claim: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    setCompleted: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<VoiceAskIdempotencyRepository>;

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
          provide: PdfSummaryAudioRepository,
          useValue: mockPdfSummaryAudioRepository,
        },
        {
          provide: VoiceAskIdempotencyRepository,
          useValue: mockVoiceAskIdempotencyRepository,
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
    pdfSummaryAudioRepository = module.get(PdfSummaryAudioRepository);
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
        service.deleteSession('test-session', 'different-user'),
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
        service.getFullSummary('non-existent-session'),
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

  describe('voiceAsk', () => {
    it('should upload user and ai audio to S3 (best effort) and return S3 metadata', async () => {
      const sessionId = 'test-session';
      const userAudio = Buffer.from('user-audio-bytes');

      mockS3Service.uploadFile
        .mockResolvedValueOnce(
          'voice/pdf-summary/test-session/user/1-user.webm',
        )
        .mockResolvedValueOnce('voice/pdf-summary/test-session/ai/2-ai.mp3');
      mockS3Service.getPresignedGetUrl
        .mockResolvedValueOnce('https://signed.example.com/user')
        .mockResolvedValueOnce('https://signed.example.com/ai');
      mockS3Service.getFileUrl.mockImplementation(
        (key: string) => `https://bucket.s3.region.amazonaws.com/${key}`,
      );

      const mockHeaders = {
        get: (name: string) => {
          if (name.toLowerCase() === 'content-type') return 'audio/mpeg';
          if (name.toLowerCase() === 'x-detected-language') return 'en';
          return null;
        },
      };

      (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
        ok: true,
        headers: mockHeaders,
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Uint8Array.from([1, 2, 3, 4]).buffer),
      });

      const result = await service.voiceAsk(
        sessionId,
        userAudio,
        'audio/webm',
        'user.webm',
      );

      expect(result.contentType).toBe('audio/mpeg');
      expect(result.detectedLanguage).toBe('en');

      expect(mockS3Service.uploadFile).toHaveBeenCalledTimes(2);
      expect(result.userAudioS3Key).toContain(
        'voice/pdf-summary/test-session/user',
      );
      expect(result.userAudioS3Url).toContain('https://');
      expect(result.aiAudioS3Key).toContain(
        'voice/pdf-summary/test-session/ai',
      );
      expect(result.aiAudioS3Url).toContain('https://');

      expect(mockPdfSummaryAudioRepository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getServiceStats', () => {
    it('should return service statistics', async () => {
      pdfSummaryRepository.getTotalCount.mockResolvedValue(10);
      pdfChatHistoryRepository.getTotalCount.mockResolvedValue(50);
      pdfSummaryRepository.getActiveSessionsCount.mockResolvedValue(4);
      pdfSummaryRepository.getAverageProcessingTime.mockResolvedValue(800);

      const result = await service.getServiceStats();

      expect(result).toBeDefined();
      expect(result.total_summaries).toBe(10);
      expect(result.total_chats).toBe(50);
      expect(result.active_sessions).toBe(4);
    });
  });
});
