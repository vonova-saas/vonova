/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Ip,
  Headers,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PdfSummaryGatewayService } from './pdf-summary.service';
import {
  UploadPdfDto,
  ChatWithPdfBodyDto,
  RateChatResponseDto,
  BulkDeleteSessionsDto,
} from './dto/pdf-summary.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { BillingGatewayService } from '../../app/billing/billing.service';

@ApiTags('PDF Summarization AI')
@Controller('api/v1/pdf-summary')
@UseGuards(JwtAuthGuard)
export class PdfSummaryGatewayController {
  private readonly planCache = new Map<
    string,
    { plan: 'free' | 'pro' | 'startup'; expiresAt: number }
  >();
  private static readonly PLAN_CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly pdfSummaryService: PdfSummaryGatewayService,
    private readonly billingService: BillingGatewayService,
  ) {}

  /** Resolve current user id from req.user (id, sub, or _id) so upload and sessions use the same value. */
  private getCurrentUserId(req: unknown): string | undefined {
    const r = req as
      | { user?: { _id?: unknown; id?: unknown; sub?: unknown } }
      | undefined;
    const raw = r?.user?.id ?? r?.user?.sub ?? r?.user?._id;
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'string') return raw.trim() || undefined;
    if (typeof raw === 'object' && raw !== null) {
      // Prefer Mongo ObjectId-style conversions when available.
      const maybeHex = (raw as { toHexString?: () => string }).toHexString?.();
      if (typeof maybeHex === 'string' && maybeHex.trim())
        return maybeHex.trim();

      const s = (raw as { toString?: () => string }).toString?.();
      if (typeof s === 'string') {
        const trimmed = s.trim();
        if (trimmed && trimmed !== '[object Object]') return trimmed;
      }
      // Avoid returning "[object Object]" for arbitrary objects
      return undefined;
    }
    if (
      typeof raw === 'number' ||
      typeof raw === 'boolean' ||
      typeof raw === 'bigint' ||
      typeof raw === 'symbol'
    ) {
      return String(raw).trim() || undefined;
    }
    return undefined;
  }

  private getCurrentUserRole(req: unknown): string | undefined {
    const r = req as { user?: { role?: unknown } } | undefined;
    const raw = r?.user?.role;
    if (raw === undefined || raw === null) return undefined;
    return String(raw).trim() || undefined;
  }

  private isStudentRole(role?: string): boolean {
    const normalized = String(role ?? '')
      .trim()
      .toLowerCase();
    return normalized === 'student' || normalized === 'student_user';
  }

  private normalizePlan(rawPlan?: string): 'free' | 'pro' | 'startup' {
    const normalized = String(rawPlan ?? '')
      .trim()
      .toLowerCase();
    if (normalized === 'pro' || normalized === 'startup') return normalized;
    if (normalized === 'basic' || normalized === 'free' || normalized === '')
      return 'free';
    return 'free';
  }

  private async resolveStudentPlan(req: unknown): Promise<'free' | 'pro' | 'startup'> {
    const r = req as
      | {
          user?: {
            _id?: unknown;
            id?: unknown;
            sub?: unknown;
            plan?: unknown;
            subscriptionPlan?: unknown;
            billingPlan?: unknown;
          };
        }
      | undefined;

    const localPlan = this.normalizePlan(
      String(
        r?.user?.plan ?? r?.user?.subscriptionPlan ?? r?.user?.billingPlan ?? '',
      ),
    );
    if (localPlan !== 'free') return localPlan;

    const userId = this.getCurrentUserId(req);
    if (!userId) return 'free';

    const cached = this.planCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.plan;
    }

    try {
      const billing = (await firstValueFrom(this.billingService.findOne(userId))) as {
        data?: { plan?: string };
      };
      const resolvedPlan = this.normalizePlan(billing?.data?.plan);
      this.planCache.set(userId, {
        plan: resolvedPlan,
        expiresAt: Date.now() + PdfSummaryGatewayController.PLAN_CACHE_TTL_MS,
      });
      return resolvedPlan;
    } catch {
      return 'free';
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload PDF file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The PDF file to upload',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'PDF uploaded successfully' })
  async uploadPDF(
    @UploadedFile() file: any,
    @Body() uploadPdfDto: UploadPdfDto,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    if (!file) {
      throw new Error('File is required');
    }
    const user_id = this.getCurrentUserId(req);
    const role = this.getCurrentUserRole(req);
    const plan = this.isStudentRole(role)
      ? await this.resolveStudentPlan(req)
      : 'pro';

    return firstValueFrom(
      this.pdfSummaryService.uploadPDF({
        file: {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
        },
        ...(user_id && { user_id }),
        ...(role && { role }),
        plan,
        ...uploadPdfDto,
        ip,
        userAgent: '',
      }),
    );
  }

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with PDF',
    description:
      'Send session_id as query parameter. Body: question and optional context_length only.',
  })
  @ApiQuery({
    name: 'session_id',
    description: 'Session ID from a previous PDF upload (required)',
    required: false,
    example: 'session-uuid-456',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat response generated successfully',
  })
  async chatWithPDF(
    @Body() body: ChatWithPdfBodyDto,
    @Query('session_id') sessionIdFromQuery: string | undefined,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    const session_id = sessionIdFromQuery?.trim() ?? '';
    if (!session_id) {
      throw new BadRequestException(
        'session_id is required (pass in query: ?session_id=...)',
      );
    }
    const user_id = this.getCurrentUserId(req);
    return firstValueFrom(
      this.pdfSummaryService.chatWithPDF({
        session_id,
        question: body.question,
        context_length: body.context_length,
        ...(user_id && { user_id }),
        ip,
        userAgent: '',
      }),
    );
  }

  @Post('voice/ask')
  @UseInterceptors(FileInterceptor('audio'))
  @ApiOperation({
    summary: 'Voice ask – send voice, get AI voice reply',
    description:
      'User uploads a voice recording; the AI transcribes it, answers in the context of the PDF session, and returns the answer as audio (e.g. MP3). Send the PDF session_id from a previous upload and an audio file (mp3, wav, ogg, webm, m4a).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['audio', 'session_id'],
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
          description: 'Voice recording file (mp3, wav, ogg, webm, m4a)',
        },
        session_id: {
          type: 'string',
          description: 'PDF session ID from a previous PDF upload',
          example: 'session-uuid-from-upload',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'AI voice response as JSON (includes metadata, S3 URLs, and audioBase64).',
    content: { 'application/json': {} },
    headers: {
      'X-Detected-Language': {
        description: 'Detected language of the user voice (e.g. en, ar)',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing audio file or session_id',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found; re-upload the PDF.',
  })
  async voiceAsk(
    @UploadedFile()
    audio:
      | { buffer: Buffer; mimetype: string; originalname: string }
      | undefined,
    @Body('session_id') sessionId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (!audio?.buffer) {
      throw new BadRequestException('audio file is required');
    }
    if (!sessionId?.trim()) {
      throw new BadRequestException('session_id is required');
    }
    const idempotency_key = randomUUID();
    const voiceUserId = this.getCurrentUserId(req);
    const role = this.getCurrentUserRole(req);
    const plan = this.isStudentRole(role)
      ? await this.resolveStudentPlan(req)
      : 'pro';
    const result = (await firstValueFrom(
      this.pdfSummaryService.voiceAsk({
        session_id: sessionId.trim(),
        audioBase64: audio.buffer.toString('base64'),
        mimeType: audio.mimetype,
        filename: audio.originalname,
        ...(voiceUserId && { user_id: voiceUserId }),
        ...(role && { role }),
        plan,
        idempotency_key,
      }),
    )) as {
      contentType: string;
      detectedLanguage?: string;
      userAudioS3Key?: string;
      userAudioS3Url?: string;
      aiAudioS3Key?: string;
      aiAudioS3Url?: string;
      audioRecord?: Record<string, unknown>;
    };

    res.setHeader('Content-Type', 'application/json');
    if (result.detectedLanguage) {
      res.setHeader('X-Detected-Language', result.detectedLanguage);
    }
    if (result.userAudioS3Key) {
      res.setHeader('X-User-Audio-S3-Key', result.userAudioS3Key);
    }
    if (result.userAudioS3Url) {
      res.setHeader('X-User-Audio-S3-Url', result.userAudioS3Url);
    }
    if (result.aiAudioS3Key) {
      res.setHeader('X-AI-Audio-S3-Key', result.aiAudioS3Key);
    }
    if (result.aiAudioS3Url) {
      res.setHeader('X-AI-Audio-S3-Url', result.aiAudioS3Url);
    }
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-Detected-Language, X-User-Audio-S3-Key, X-User-Audio-S3-Url, X-AI-Audio-S3-Key, X-AI-Audio-S3-Url',
    );

    const fallbackRecord = {
      session_id: sessionId.trim(),
      ...(voiceUserId && { user_id: voiceUserId }),
      user_audio_s3_key: result.userAudioS3Key,
      user_audio_s3_url: result.userAudioS3Url,
      user_audio_mime_type: audio.mimetype,
      ai_audio_s3_key: result.aiAudioS3Key,
      ai_audio_s3_url: result.aiAudioS3Url,
      ai_audio_content_type: result.contentType,
      detected_language: result.detectedLanguage,
    };

    res.status(200).json({
      ...fallbackRecord,
      ...(result.audioRecord ?? {}),
      contentType: result.contentType,
    });
  }

  @Get('summarize')
  @ApiOperation({ summary: 'Get full PDF summary' })
  @ApiQuery({
    name: 'session_id',
    description: 'Session ID returned from upload',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Summary generated successfully' })
  async getFullSummary(
    @Query('session_id') sessionId: string,
    @Request() req: any,
    @Ip() ip: string,
  ) {
    const user_id = this.getCurrentUserId(req);
    return firstValueFrom(
      this.pdfSummaryService.getFullSummary({
        session_id: sessionId?.trim?.() ?? sessionId,
        ...(user_id && { user_id }),
        ip,
        userAgent: '',
      }),
    );
  }

  @Get('session/:sessionId/full')
  @ApiOperation({
    summary: 'Get one session by ID with full contents',
    description:
      'Returns a single session by session_id with all contents: PDF metadata, chat history (user & AI), full summary, and voice recordings.',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description:
      'Session with chat_history, full_summary, audio_recordings, and pdf metadata',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSessionWithFullData(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    const userId = this.getCurrentUserId(req);
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    const trimmedSessionId = sessionId?.trim();
    if (!trimmedSessionId) {
      throw new BadRequestException('session_id is required');
    }
    const result = await firstValueFrom(
      this.pdfSummaryService.getSessionWithFullData({
        user_id: userId,
        sessionId: trimmedSessionId,
      }),
    );
    if (result?.data && typeof result.data === 'object') {
      (result.data as Record<string, unknown>).audio_recordings =
        (result.data as Record<string, unknown>).audio_recordings ?? [];
    }
    return result;
  }

  @Get('session/:sessionId/chat-history')
  @ApiOperation({ summary: 'Get session chat history' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
  })
  async getSessionChatHistory(
    @Param('sessionId') sessionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.pdfSummaryService.getSessionChatHistory({
        sessionId,
        page,
        limit,
      }),
    );
  }

  @Post('chat/rate')
  @ApiOperation({ summary: 'Rate chat response' })
  @ApiResponse({ status: 200, description: 'Rating submitted successfully' })
  async rateChatResponse(
    @Body() rateChatResponseDto: RateChatResponseDto,
    @Request() req: any,
  ) {
    const user_id = this.getCurrentUserId(req);
    return firstValueFrom(
      this.pdfSummaryService.rateChatResponse({
        ...rateChatResponseDto,
        ...(user_id && { user_id }),
      }),
    );
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check for PDF summary service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    return firstValueFrom(this.pdfSummaryService.getHealth());
  }

  @Public()
  @Get('test-ai-connection')
  @ApiOperation({ summary: 'Test connectivity to PDF summary AI service' })
  @ApiResponse({ status: 200, description: 'AI connectivity status' })
  async testAiConnection() {
    return firstValueFrom(this.pdfSummaryService.testAiConnection());
  }

  @Delete('session/:sessionId')
  @ApiOperation({ summary: 'Delete session and cleanup resources' })
  @ApiParam({ name: 'sessionId', description: 'Session ID to delete' })
  @ApiResponse({ status: 204, description: 'Session deleted successfully' })
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    const userId = this.getCurrentUserId(req);
    if (!userId) throw new BadRequestException('User not authenticated');
    return firstValueFrom(
      this.pdfSummaryService.deleteSession({
        sessionId,
        userId,
      }),
    );
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Get all sessions for the current user',
    description:
      'Returns all PDF summary sessions for the current user. Each item includes session_id, summaryId, filename, original_filename, created_at, updated_at.',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of sessions with session_id, summaryId, filename, original_filename, created_at, updated_at',
    schema: {
      example: {
        success: true,
        data: [
          {
            session_id: '810769b8-12aa-45d7-aa6a-54d0cf6fbde9',
            summaryId: '9c0c0750-f088-4b94-810a-c88f520b43f9',
            filename: 'Mohamed_Abolyazeed_Backend_CV.pdf',
            original_filename: 'Mohamed_Abolyazeed_Backend_CV.pdf',
            created_at: '2026-03-11T18:26:33.008Z',
            updated_at: '2026-03-11T18:26:33.008Z',
          },
        ],
      },
    },
  })
  async getSessionsByUserId(@Request() req: any) {
    const userId = this.getCurrentUserId(req);
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await firstValueFrom(
      this.pdfSummaryService.getSessionsByUserId({ user_id: userId }),
    );
    if (result?.data && Array.isArray(result.data)) {
      const sessions = result.data as Array<Record<string, unknown>>;
      result.data = sessions.map((session: Record<string, unknown>) => ({
        session_id: session.session_id,
        summaryId: session.summaryId,
        filename: session.filename,
        original_filename: session.original_filename,
        created_at: session.created_at,
        updated_at: session.updated_at,
      }));
    }
    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get service statistics and metrics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getServiceStats(@Request() req: any) {
    const userId = this.getCurrentUserId(req);
    return firstValueFrom(
      this.pdfSummaryService.getServiceStats({
        user_id: userId,
      }),
    );
  }

  @Post('batch/delete')
  @ApiOperation({ summary: 'Bulk delete multiple sessions' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete operation completed',
  })
  async bulkDeleteSessions(
    @Body() bulkDeleteDto: BulkDeleteSessionsDto,
    @Request() req: any,
  ) {
    const userId = this.getCurrentUserId(req);
    if (!userId) throw new BadRequestException('User not authenticated');
    return firstValueFrom(
      this.pdfSummaryService.bulkDeleteSessions({
        ...bulkDeleteDto,
        user_id: userId,
      }),
    );
  }

  @Get('analytics/queries')
  @ApiOperation({ summary: 'Get query pattern analytics and insights' })
  @ApiQuery({
    name: 'start_date',
    description: 'Start date (ISO 8601)',
    required: false,
  })
  @ApiQuery({
    name: 'end_date',
    description: 'End date (ISO 8601)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Query analytics retrieved successfully',
  })
  async getQueryAnalytics(
    @Request() req: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const currentUserId = this.getCurrentUserId(req);
    return firstValueFrom(
      this.pdfSummaryService.getQueryAnalytics({
        start_date: startDate,
        end_date: endDate,
        user_id: currentUserId,
      }),
    );
  }
}
