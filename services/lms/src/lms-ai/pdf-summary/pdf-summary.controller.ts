/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Controller, BadRequestException, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx } from '@nestjs/microservices';
import { NatsContext } from '@nestjs/microservices';
import { PdfSummaryService } from './pdf-summary.service';

@Controller()
export class PdfSummaryController {
  private readonly logger = new Logger(PdfSummaryController.name);

  constructor(private readonly pdfSummaryService: PdfSummaryService) {}

  @MessagePattern({ cmd: 'lms.ai.pdf.upload' })
  async uploadPDF(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    this.logger.log('Received PDF upload request');
    const {
      file,
      user_id,
      auto_summarize,
      summary_type,
      language,
      ip = '',
      userAgent = '',
    } = data;

    this.logger.log(
      `Received PDF upload request: filename="${file.originalname}", size=${file.buffer?.length}, user_id=${user_id}, auto_summarize=${auto_summarize}`,
    );

    if (!file) {
      this.logger.warn('PDF upload request missing file');
      throw new BadRequestException('No file uploaded');
    }

    // Additional file validation
    if (file.mimetype !== 'application/pdf') {
      this.logger.warn(
        `Invalid file type uploaded: ${file.mimetype}, expected: application/pdf`,
      );
      throw new BadRequestException(
        'Invalid file type. Only PDF files are allowed.',
      );
    }

    const request = {
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
      ...(user_id && { user_id }),
      auto_summarize,
      ...(summary_type && { summary_type }),
      ...(language && { language }),
    };

    return this.pdfSummaryService.uploadPDF(request, ip, userAgent);
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.chat' })
  async chatWithPDF(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const {
      session_id,
      question,
      user_id,
      context_length,
      ip = '',
      userAgent = '',
    } = data;

    this.logger.log(
      `Received PDF chat request: session_id=${session_id}, user_id=${user_id}, question_length=${question?.length}`,
    );

    const request = {
      session_id,
      question,
      ...(user_id && { user_id }),
      ...(context_length && { context_length }),
    };

    return this.pdfSummaryService.chatWithPDF(request, ip, userAgent);
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.summarize' })
  async getFullSummary(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { session_id, user_id, ip = '', userAgent = '' } = data;

    this.logger.log(
      `Received full summary request: session_id=${session_id}, user_id=${user_id}`,
    );

    if (!session_id) {
      this.logger.warn('Full summary request missing session_id');
      throw new BadRequestException('session_id is required');
    }

    return this.pdfSummaryService.getFullSummary(
      session_id,
      user_id,
      ip,
      userAgent,
    );
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.getChatHistory' })
  async getSessionChatHistory(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { sessionId, page = '1', limit = '20' } = data;

    this.logger.log(
      `Received chat history request: sessionId=${sessionId}, page=${page}, limit=${limit}`,
    );

    if (!sessionId || sessionId.trim() === '') {
      this.logger.warn('Chat history request missing sessionId');
      throw new BadRequestException('sessionId is required');
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

    if (isNaN(pageNum) || isNaN(limitNum)) {
      this.logger.warn(
        `Invalid pagination parameters: page=${page}, limit=${limit}`,
      );
      throw new BadRequestException('Invalid page or limit parameter');
    }

    const result = await this.pdfSummaryService.getSessionChatHistory(
      sessionId.trim(),
      pageNum,
      limitNum,
    );

    this.logger.log(
      `Retrieved ${result.chats?.length || 0} chat history records for session: ${sessionId}`,
    );

    return {
      success: true,
      message: 'Session chat history retrieved successfully',
      data: result,
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.rateChat' })
  async rateChatResponse(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { chatId, rating, user_id } = data;

    this.logger.log(
      `Received chat rating request: chatId=${chatId}, rating=${rating}, user_id=${user_id}`,
    );

    return this.pdfSummaryService.rateChatResponse(chatId, rating, user_id);
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.health' })
  healthCheck(@Payload() _data: any, @Ctx() _ctx: NatsContext) {
    this.logger.log('PDF summary service health check requested');

    return {
      success: true,
      message: 'PDF Summary Service is healthy',
      timestamp: new Date().toISOString(),
      service: 'pdf-summary',
      version: '1.0.0',
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.testAiConnection' })
  async testAiConnection(@Payload() _data: any, @Ctx() _ctx: NatsContext) {
    this.logger.log('PDF AI service connection test requested');

    const status = await this.pdfSummaryService.testAiConnection();
    return {
      success: status.ok,
      message: status.message,
      endpoint: status.endpoint,
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.deleteSession' })
  async deleteSession(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { sessionId, userId } = data;

    this.logger.log(
      `Received session deletion request: sessionId=${sessionId}, user_id=${userId}`,
    );

    if (!sessionId || sessionId.trim() === '') {
      this.logger.warn('Session deletion request missing sessionId');
      throw new BadRequestException('Session ID is required');
    }

    const result = await this.pdfSummaryService.deleteSession(
      sessionId.trim(),
      userId,
    );
    return result;
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.getSessionsByUserId' })
  async getSessionsByUserId(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const rawUserId = data?.user_id ?? data?.userId ?? data?.user?.id;
    const userId =
      rawUserId === undefined || rawUserId === null
        ? undefined
        : String(rawUserId);

    this.logger.log(
      `Received get sessions by user ID request: user_id=${userId}`,
    );

    if (!userId) {
      this.logger.warn('Get sessions by user ID request missing user_id');
      throw new BadRequestException('user_id is required');
    }

    const result = await this.pdfSummaryService.getSessionsByUserId(userId);

    this.logger.log(
      `Retrieved ${result.data?.length || 0} sessions for user: ${userId}`,
    );

    return result;
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.getSessionsWithFullData' })
  async getSessionsWithFullData(
    @Payload() data: any,
    @Ctx() _ctx: NatsContext,
  ) {
    const rawUserId = data?.user_id ?? data?.userId ?? data?.user?.id;
    const userId =
      rawUserId === undefined || rawUserId === null
        ? undefined
        : String(rawUserId);

    this.logger.log(
      `Received get sessions with full data request: user_id=${userId}`,
    );

    if (!userId) {
      this.logger.warn('Get sessions with full data request missing user_id');
      throw new BadRequestException('user_id is required');
    }

    const result = await this.pdfSummaryService.getSessionsWithFullData(userId);

    this.logger.log(
      `Retrieved ${result.data?.length || 0} sessions with full data for user: ${userId}`,
    );

    return result;
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.getSessionWithFullData' })
  async getSessionWithFullData(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const rawUserId = data?.user_id ?? data?.userId ?? data?.user?.id;
    const userId =
      rawUserId === undefined || rawUserId === null
        ? undefined
        : String(rawUserId);
    const sessionId = data?.sessionId ?? data?.session_id;

    this.logger.log(
      `Received get session with full data request: sessionId=${sessionId}, user_id=${userId}`,
    );

    if (!userId) {
      this.logger.warn('Get session with full data request missing user_id');
      throw new BadRequestException('user_id is required');
    }
    if (!sessionId || String(sessionId).trim() === '') {
      this.logger.warn('Get session with full data request missing sessionId');
      throw new BadRequestException('session_id is required');
    }

    return this.pdfSummaryService.getSessionWithFullData(
      String(sessionId).trim(),
      userId,
    );
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.stats' })
  async getServiceStats(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const rawUserId = data?.user_id ?? data?.userId ?? data?.user?.id;
    const userId =
      rawUserId === undefined || rawUserId === null
        ? undefined
        : String(rawUserId);

    this.logger.log(`Received service stats request: user_id=${userId}`);

    if (!userId) {
      this.logger.warn('Service stats request missing user_id');
      throw new BadRequestException('user_id is required');
    }

    const stats = await this.pdfSummaryService.getServiceStats(userId);

    this.logger.log(
      `Retrieved service stats for user ${userId}: ${JSON.stringify(stats)}`,
    );

    return {
      success: true,
      message: 'Service statistics retrieved successfully',
      data: stats,
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.batchDelete' })
  async bulkDeleteSessions(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { session_ids, user_id } = data;

    this.logger.log(
      `Received bulk delete request: ${session_ids?.length || 0} sessions, user_id=${user_id}`,
    );

    const result = await this.pdfSummaryService.bulkDeleteSessions(
      session_ids,
      user_id,
    );

    this.logger.log(
      `Bulk delete completed: ${result.deleted || 0} deleted, ${result.failed || 0} failed out of ${session_ids?.length || 0} total`,
    );

    return {
      success: true,
      message: 'Bulk delete operation completed',
      data: result,
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.getQueryAnalytics' })
  async getQueryAnalytics(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { start_date, end_date, user_id } = data;

    this.logger.log(
      `Received query analytics request: user_id=${user_id}, start_date=${start_date}, end_date=${end_date}`,
    );

    const analytics = await this.pdfSummaryService.getQueryAnalytics(
      start_date,
      end_date,
      user_id,
    );

    this.logger.log(`Retrieved query analytics: ${JSON.stringify(analytics)}`);

    return {
      success: true,
      message: 'Query analytics retrieved successfully',
      data: analytics,
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.voiceAsk' })
  async voiceAsk(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const {
      session_id,
      audioBase64,
      mimeType,
      filename,
      user_id,
      idempotency_key,
    } = data;

    this.logger.log(
      `Received voice ask request: session_id=${session_id}, user_id=${user_id}, audio_size=${audioBase64?.length}, filename=${filename}`,
    );

    if (!session_id || !audioBase64) {
      this.logger.warn('Voice ask request missing session_id or audioBase64');
      throw new BadRequestException('session_id and audioBase64 are required');
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    return this.pdfSummaryService.voiceAsk(
      session_id,
      audioBuffer,
      mimeType || 'audio/webm',
      filename,
      user_id,
      idempotency_key,
    );
  }
}
