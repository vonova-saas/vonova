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
  ChatWithPdfDto,
  RateChatResponseDto,
  BulkDeleteSessionsDto,
} from './dto/pdf-summary.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('PDF Summarization AI')
@Controller('api/v1/pdf-summary')
@UseGuards(JwtAuthGuard)
export class PdfSummaryGatewayController {
  constructor(private readonly pdfSummaryService: PdfSummaryGatewayService) { }

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
    @Headers('user-agent') userAgent: string,
  ) {
    if (!file) {
      throw new Error('File is required');
    }
    return firstValueFrom(
      this.pdfSummaryService.uploadPDF({
        file: {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
        },
        user_id: req.user._id,
        ...uploadPdfDto,
        ip,
        userAgent,
      }),
    );
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with PDF' })
  @ApiResponse({
    status: 200,
    description: 'Chat response generated successfully',
  })
  async chatWithPDF(
    @Body() chatWithPdfDto: ChatWithPdfDto,
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return firstValueFrom(
      this.pdfSummaryService.chatWithPDF({
        ...chatWithPdfDto,
        user_id: req.user._id,
        ip,
        userAgent,
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
    const result = (await firstValueFrom(
      this.pdfSummaryService.voiceAsk({
        session_id: sessionId.trim(),
        audioBase64: audio.buffer.toString('base64'),
        mimeType: audio.mimetype,
        filename: audio.originalname,
        user_id: req?.user?._id,
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
      user_id: req?.user?._id,
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
    @Headers('user-agent') userAgent: string,
  ) {
    return firstValueFrom(
      this.pdfSummaryService.getFullSummary({
        session_id: sessionId,
        user_id: req.user._id,
        ip,
        userAgent,
      }),
    );
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
    return firstValueFrom(
      this.pdfSummaryService.rateChatResponse({
        ...rateChatResponseDto,
        user_id: req.user._id,
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
    return firstValueFrom(
      this.pdfSummaryService.deleteSession({
        sessionId,
        userId: req.user._id,
      }),
    );
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Get all sessions, PDFs, and audio recordings for the current user',
    description:
      'Returns all PDF summary sessions with PDF metadata. Each session includes a nested audio_recordings array (voice/ask recordings for that session). Session ID appears once per session, not repeated per recording.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Sessions with nested audio_recordings per session',
  })
  async getSessionsByUserId(@Request() req: any) {
    const rawUserId = req?.user?._id ?? req?.user?.id;
    const userId =
      rawUserId === undefined || rawUserId === null
        ? undefined
        : String(rawUserId);
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await firstValueFrom(
      this.pdfSummaryService.getSessionsByUserId({ user_id: userId }),
    );
    if (result?.data && Array.isArray(result.data)) {
      result.data = result.data.map((session: Record<string, unknown>) => ({
        ...session,
        audio_recordings: session.audio_recordings ?? [],
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
    const rawUserId = req?.user?._id ?? req?.user?.id;
    const userId =
      rawUserId === undefined || rawUserId === null
        ? undefined
        : String(rawUserId);
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
    return firstValueFrom(
      this.pdfSummaryService.bulkDeleteSessions({
        ...bulkDeleteDto,
        user_id: req.user._id,
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
  @ApiQuery({
    name: 'user_id',
    description: 'Filter by user ID',
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
    @Query('user_id') userId?: string,
  ) {
    return firstValueFrom(
      this.pdfSummaryService.getQueryAnalytics({
        start_date: startDate,
        end_date: endDate,
        user_id: userId || req.user._id,
      }),
    );
  }
}
