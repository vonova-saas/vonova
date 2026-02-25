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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
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

@ApiTags('PDF Summary')
@Controller('api/v1/pdf-summary')
@UseGuards(JwtAuthGuard)
export class PdfSummaryGatewayController {
  constructor(private readonly pdfSummaryService: PdfSummaryGatewayService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload PDF file' })
  @ApiConsumes('multipart/form-data')
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

  @Get('stats')
  @ApiOperation({ summary: 'Get service statistics and metrics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getServiceStats() {
    return firstValueFrom(this.pdfSummaryService.getServiceStats());
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
