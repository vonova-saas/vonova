import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Ip,
  Headers,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PdfSummaryService } from './pdf-summary.service';
import {
  UploadPdfDto,
  ChatWithPdfDto,
  RateChatResponseDto,
  PdfSummaryResponseDto,
  PdfUploadResponseDto,
  PdfChatResponseDto
} from './dto/pdf-summary.dto';
import { SignedContextGuard } from '../common/guards/signed-context.guard';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';

@ApiTags('PDF Summary')
@Controller('pdf-summary')
@UseGuards(SignedContextGuard)
@UseInterceptors(LoggingInterceptor)
export class PdfSummaryController {
  constructor(private readonly pdfSummaryService: PdfSummaryService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload PDF file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'PDF uploaded successfully',
    type: PdfUploadResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async uploadPDF(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadPdfDto: UploadPdfDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<PdfUploadResponseDto> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Additional file validation
    if (file.mimetype !== 'application/pdf') {
      throw new Error('Invalid file type. Only PDF files are allowed.');
    }

    const request = {
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype
      },
      ...(uploadPdfDto.user_id && { user_id: uploadPdfDto.user_id }),
      auto_summarize: uploadPdfDto.auto_summarize,
      ...(uploadPdfDto.summary_type && { summary_type: uploadPdfDto.summary_type })
    };

    return this.pdfSummaryService.uploadPDF(request, ip, userAgent);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with PDF' })
  @ApiResponse({
    status: 200,
    description: 'Chat response generated successfully',
    type: PdfChatResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async chatWithPDF(
    @Body() chatWithPdfDto: ChatWithPdfDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<PdfChatResponseDto> {
    const request = {
      session_id: chatWithPdfDto.session_id,
      question: chatWithPdfDto.question,
      ...(chatWithPdfDto.user_id && { user_id: chatWithPdfDto.user_id }),
      ...(chatWithPdfDto.context_length && { context_length: chatWithPdfDto.context_length })
    };

    return this.pdfSummaryService.chatWithPDF(request, ip, userAgent);
  }

  @Get('summarize')
  @ApiOperation({ summary: 'Get full PDF summary' })
  @ApiQuery({ name: 'session_id', description: 'Session ID returned from upload', required: true })
  @ApiQuery({ name: 'user_id', description: 'Optional user identifier', required: false })
  @ApiResponse({
    status: 200,
    description: 'Summary generated successfully',
    type: PdfSummaryResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'PDF summary not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getFullSummary(
    @Query('session_id') sessionId: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Query('user_id') userId?: string
  ): Promise<PdfSummaryResponseDto> {
    if (!sessionId) {
      throw new Error('session_id is required');
    }

    return this.pdfSummaryService.getFullSummary(sessionId, userId, ip, userAgent);
  }

  @Get('session/:sessionId/chat-history')
  @ApiOperation({ summary: 'Get session chat history' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false })
  @ApiQuery({ name: 'limit', description: 'Number of items per page', required: false })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Session chat history retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            chats: { type: 'array', items: { type: 'object' } },
            total: { type: 'number', example: 15 },
            page: { type: 'number', example: 1 },
            totalPages: { type: 'number', example: 1 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSessionChatHistory(
    @Param('sessionId') sessionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      chats: any[];
      total: number;
      page: number;
      totalPages: number;
    };
  }> {
    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException('sessionId is required');
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new BadRequestException('Invalid page or limit parameter');
    }

    const result = await this.pdfSummaryService.getSessionChatHistory(sessionId, pageNum, limitNum);

    return {
      success: true,
      message: 'Session chat history retrieved successfully',
      data: result
    };
  }

  @Post('chat/rate')
  @ApiOperation({ summary: 'Rate chat response' })
  @ApiResponse({
    status: 200,
    description: 'Rating submitted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Rating submitted successfully' },
        data: {
          type: 'object',
          properties: {
            chatId: { type: 'string' },
            rating: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async rateChatResponse(
    @Body() rateChatResponseDto: RateChatResponseDto
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return this.pdfSummaryService.rateChatResponse(
      rateChatResponseDto.chatId,
      rateChatResponseDto.rating,
      rateChatResponseDto.user_id
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for PDF summary service' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'PDF Summary Service is healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string', example: 'pdf-summary' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  healthCheck() {
    return {
      success: true,
      message: 'PDF Summary Service is healthy',
      timestamp: new Date().toISOString(),
      service: 'pdf-summary',
      version: '1.0.0'
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get service statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Service statistics retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            total_summaries: { type: 'number', example: 0 },
            total_chats: { type: 'number', example: 0 },
            active_sessions: { type: 'number', example: 0 },
            average_processing_time: { type: 'number', example: 0 }
          }
        }
      }
    }
  })
  async getServiceStats() {
    // TODO: Implement statistics collection
    return {
      success: true,
      message: 'Service statistics retrieved successfully',
      data: {
        total_summaries: 0,
        total_chats: 0,
        active_sessions: 0,
        average_processing_time: 0
      }
    };
  }
}
