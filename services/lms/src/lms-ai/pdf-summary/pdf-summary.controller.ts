/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, BadRequestException } from '@nestjs/common';
import { MessagePattern, Payload, Ctx } from '@nestjs/microservices';
import { NatsContext } from '@nestjs/microservices';
import { PdfSummaryService } from './pdf-summary.service';

@Controller()
export class PdfSummaryController {
  constructor(private readonly pdfSummaryService: PdfSummaryService) { }

  @MessagePattern({ cmd: 'lms.ai.pdf.upload' })
  async uploadPDF(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { file, user_id, auto_summarize, summary_type, language, ip = '', userAgent = '' } = data;

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Additional file validation
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Invalid file type. Only PDF files are allowed.');
    }

    const request = {
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype
      },
      ...(user_id && { user_id }),
      auto_summarize,
      ...(summary_type && { summary_type }),
      ...(language && { language })
    };

    return this.pdfSummaryService.uploadPDF(request, ip, userAgent);
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.chat' })
  async chatWithPDF(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { session_id, question, user_id, context_length, ip = '', userAgent = '' } = data;
    const request = {
      session_id,
      question,
      ...(user_id && { user_id }),
      ...(context_length && { context_length })
    };

    return this.pdfSummaryService.chatWithPDF(request, ip, userAgent);
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.summarize' })
  async getFullSummary(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { session_id, user_id, ip = '', userAgent = '' } = data;
    if (!session_id) {
      throw new BadRequestException('session_id is required');
    }

    return this.pdfSummaryService.getFullSummary(session_id, user_id, ip, userAgent);
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.getChatHistory' })
  async getSessionChatHistory(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { sessionId, page = '1', limit = '20' } = data;

    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException('sessionId is required');
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new BadRequestException('Invalid page or limit parameter');
    }

    const result = await this.pdfSummaryService.getSessionChatHistory(sessionId.trim(), pageNum, limitNum);

    return {
      success: true,
      message: 'Session chat history retrieved successfully',
      data: result
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.rateChat' })
  async rateChatResponse(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { chatId, rating, user_id } = data;
    return this.pdfSummaryService.rateChatResponse(chatId, rating, user_id);
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.health' })
  healthCheck(@Payload() _data: any, @Ctx() _ctx: NatsContext) {
    return {
      success: true,
      message: 'PDF Summary Service is healthy',
      timestamp: new Date().toISOString(),
      service: 'pdf-summary',
      version: '1.0.0'
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.testAiConnection' })
  async testAiConnection(@Payload() _data: any, @Ctx() _ctx: NatsContext) {
    const status = await this.pdfSummaryService.testAiConnection();
    return {
      success: status.ok,
      message: status.message,
      endpoint: status.endpoint,
      timestamp: new Date().toISOString()
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.deleteSession' })
  async deleteSession(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { sessionId, userId } = data;
    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException('Session ID is required');
    }

    await this.pdfSummaryService.deleteSession(sessionId.trim(), userId);
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.stats' })
  async getServiceStats(@Payload() _data: any, @Ctx() _ctx: NatsContext) {
    const stats = await this.pdfSummaryService.getServiceStats();
    return {
      success: true,
      message: 'Service statistics retrieved successfully',
      data: stats
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.batchDelete' })
  async bulkDeleteSessions(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { session_ids, user_id } = data;
    const result = await this.pdfSummaryService.bulkDeleteSessions(
      session_ids,
      user_id
    );

    return {
      success: true,
      message: 'Bulk delete operation completed',
      data: result
    };
  }

  @MessagePattern({ cmd: 'lms.ai.pdf.getQueryAnalytics' })
  async getQueryAnalytics(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { start_date, end_date, user_id } = data;
    const analytics = await this.pdfSummaryService.getQueryAnalytics(start_date, end_date, user_id);
    return {
      success: true,
      message: 'Query analytics retrieved successfully',
      data: analytics
    };
  }
}
