import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PdfSummaryRepository } from '../database/repositories/pdf-summary.repository';
import { PdfChatHistoryRepository } from '../database/repositories/pdf-chat-history.repository';
import { S3Service } from '../common/services/s3.service';
import {
  IPDFSummaryRequest,
  IPDFSummaryResponse,
  IPDFSummaryData,
  IPDFChatRequest,
  IPDFChatResponse,
  IPDFUploadRequest,
  IPDFUploadResponse
} from './interfaces/pdf-summary.interface';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class PdfSummaryService {
  private readonly logger = new Logger(PdfSummaryService.name);
  private readonly PYTHON_SERVICE_URL: string;
  private readonly FALLBACK_PYTHON_SERVICE_URL: string;
  private readonly DEFAULT_TIMEOUT = 300000; // 5 minutes timeout

  constructor(
    private readonly pdfSummaryRepository: PdfSummaryRepository,
    private readonly pdfChatHistoryRepository: PdfChatHistoryRepository,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service
  ) {
    // Prefer env; default to 127.0.0.1 to avoid IPv6 (::1) resolution issues with localhost
    const primary = this.configService.get('PDF_SUMMARY_AI_SERVICE_URL') || 'http://127.0.0.1:5001';
    const fallback = this.configService.get('FALLBACK_PDF_SUMMARY_AI_SERVICE_URL');

    // Normalize localhost -> 127.0.0.1 to avoid IPv6 (::1) issues on Windows/Postman
    this.PYTHON_SERVICE_URL = primary.replace('http://localhost', 'http://127.0.0.1').replace('https://localhost', 'https://127.0.0.1');
    this.FALLBACK_PYTHON_SERVICE_URL = fallback ? fallback.replace('http://localhost', 'http://127.0.0.1').replace('https://localhost', 'https://127.0.0.1') : fallback as any;
  }

  async chatWithPDF(
    request: IPDFChatRequest,
    userIp?: string,
    userAgent?: string
  ): Promise<IPDFChatResponse> {
    const startTime = Date.now();

    try {
      // Validate session exists
      const session = await this.validateSession(request.session_id);

      // Call Python AI service for chat
      this.logger.log(`Calling Python service for chat with session_id: ${request.session_id}`);
      const aiResponse = await this.callPythonService(
        `${this.PYTHON_SERVICE_URL}/ask`,
        {
          session_id: request.session_id,
          question: request.question,
          context_length: request.context_length || 1000
        }
      );

      // Normalize external status/levels to internal enums
      const normalizedWizardStatus = ((): 'active' | 'inactive' | 'error' => {
        const raw = String(aiResponse.ai_wizard_status || '').toUpperCase();
        if (raw === 'SUCCESS' || raw === 'ACTIVE' || raw === '') return 'active';
        if (raw === 'ERROR' || raw === 'FAILED' || raw === 'FAIL') return 'error';
        return 'inactive';
      })();

      const normalizedMagicLevel = ((): 'normal' | 'enhanced' | 'cached' => {
        const raw = String(aiResponse.magic_level || '').toUpperCase();
        if (raw === 'MAXIMUM' || raw === 'HIGH' || raw === 'ENHANCED') return 'enhanced';
        if (raw === 'CACHED' || raw === 'CACHE') return 'cached';
        return 'normal';
      })();

      // Save chat history
      await this.saveChatHistory(
        request.session_id,
        session.filename,
        request.question,
        aiResponse.answer,
        { ...aiResponse, ai_wizard_status: normalizedWizardStatus, magic_level: normalizedMagicLevel },
        startTime,
        request.user_id,
        userIp,
        userAgent
      );

      // Return formatted response
      return {
        status: true,
        answer: aiResponse.answer,
        session_id: request.session_id,
        filename: session.filename,
        ...(request.user_id && { user_id: request.user_id }),
        ai_wizard_status: normalizedWizardStatus,
        magic_level: normalizedMagicLevel,
        message: aiResponse.message || 'Chat response generated successfully',
        metadata: {
          generated: new Date().toISOString(),
          ai_model_used: aiResponse.ai_model_used || 'gemini',
          response_time_ms: Date.now() - startTime,
          tokens_used: aiResponse.tokens_used || 0
        }
      };

    } catch (error) {
      this.logger.error('Error in PDF chat:', error);
      throw error;
    }
  }

  async uploadPDF(
    request: IPDFUploadRequest,
    userIp?: string,
    userAgent?: string
  ): Promise<IPDFUploadResponse> {
    const startTime = Date.now();
    const sessionId = uuidv4();

    try {
      // Validate file
      if (!request.file || request.file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are allowed');
      }

      const fileContent = request.file.buffer;
      const filename = request.file.originalname;
      const fileSize = fileContent.length;
      const totalPages = await this.extractPageCount(fileContent);
      const fileHash = this.generateFileHash(fileContent);

      // Upload file to S3
      this.logger.log(`Uploading PDF file to S3: ${filename}`);
      const s3Key = await this.s3Service.uploadFile(
        fileContent,
        filename,
        'application/pdf',
        'pdfs'
      );
      const s3Url = this.s3Service.getFileUrl(s3Key);
      this.logger.log(`PDF file uploaded to S3: ${s3Key}`);

      // Check for existing session with same hash
      const existingSummary = await this.findExistingSummary(fileHash, 'brief');
      if (existingSummary) {
        return {
          status: true,
          session_id: existingSummary.session_id,
          brief_summary: existingSummary.summary_content.substring(0, 200) + '...',
          magic_level: 'cached',
          enchantment_status: 'reused',
          message: 'PDF already processed, using cached summary',
          metadata: {
            filename: existingSummary.filename,
            file_size_bytes: existingSummary.file_size_bytes,
            total_pages: existingSummary.total_pages,
            processing_time_ms: 0,
            s3_key: s3Key,
            s3_url: s3Url
          }
        };
      }

      // Upload to Python service
      const uploadResponse = await this.callPythonService(
        `${this.PYTHON_SERVICE_URL}/upload`,
        { filename, file_size: fileSize, auto_summarize: request.auto_summarize },
        fileContent,
        filename
      );

      // Use the session_id from Python service response
      const pythonSessionId = uploadResponse.session_id;

      // Save basic summary data
      const summaryData = await this.saveBasicSummary(
        pythonSessionId,
        filename,
        fileSize,
        totalPages,
        fileHash,
        uploadResponse.brief_summary || 'Summary will be generated on demand',
        request.user_id,
        userIp,
        userAgent
      );

      return {
        status: true,
        session_id: pythonSessionId,
        brief_summary: uploadResponse.brief_summary || 'PDF uploaded successfully',
        ...(request.user_id && { user_id: request.user_id }),
        magic_level: uploadResponse.magic_level || 'normal',
        enchantment_status: uploadResponse.enchantment_status || 'uploaded',
        message: uploadResponse.message || 'PDF uploaded and processed successfully',
        metadata: {
          filename,
          file_size_bytes: fileSize,
          total_pages: totalPages,
          processing_time_ms: Date.now() - startTime,
          s3_key: s3Key,
          s3_url: s3Url
        }
      };

    } catch (error) {
      this.logger.error('Error uploading PDF:', error);
      throw error;
    }
  }

  async getSessionChatHistory(
    sessionId: string,
    page = 1,
    limit = 20
  ): Promise<{
    chats: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw new BadRequestException('Session ID is required');
      }

      // Validate pagination parameters
      const validPage = Math.max(1, page);
      const validLimit = Math.min(100, Math.max(1, limit));

      this.logger.log(`Fetching chat history for session: ${sessionId}, page: ${validPage}, limit: ${validLimit}`);

      const result = await this.pdfChatHistoryRepository.findBySessionId(sessionId, validPage, validLimit);

      this.logger.log(`Found ${result.total} chat entries for session: ${sessionId}`);

      return result;
    } catch (error) {
      this.logger.error(`Error fetching chat history for session ${sessionId}:`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve chat history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getFullSummary(
    sessionId: string,
    userId?: string,
    userIp?: string,
    userAgent?: string
  ): Promise<IPDFSummaryResponse> {
    const startTime = Date.now();

    // Ensure session exists and get filename
    const session = await this.validateSession(sessionId);

    // Call AI service GET /summarize with session_id
    const endpoint = `${this.PYTHON_SERVICE_URL}/summarize?session_id=${encodeURIComponent(sessionId)}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(`AI summarize failed: ${response.status} ${errorText}`);
    }

    const aiResponse = await response.json();

    return {
      status: true,
      summary: aiResponse.summary || 'Summary generated successfully',
      summary_type: aiResponse.summary_type || 'detailed',
      filename: session.filename,
      session_id: sessionId,
      metadata: {
        generated: new Date().toISOString(),
        ai_model_used: aiResponse.ai_model_used || 'gemini',
        processing_time_ms: Date.now() - startTime,
        file_size_bytes: aiResponse.file_size_bytes || 0,
        total_pages: aiResponse.total_pages || 0
      }
    };
  }

  async rateChatResponse(
    chatId: string,
    rating: number,
    userId: string
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      await this.pdfChatHistoryRepository.updateRating(chatId, rating);

      return {
        success: true,
        message: 'Chat response rated successfully',
        data: { chatId, rating, user_id: userId }
      };
    } catch (error) {
      this.logger.error('Error rating chat response:', error);
      throw new InternalServerErrorException('Failed to rate chat response');
    }
  }

  // Private helper methods
  private async validateSession(sessionId: string): Promise<{ filename: string }> {
    // First try to get from database
    const summary = await this.pdfSummaryRepository.findBySessionId(sessionId);
    if (summary) {
      return { filename: summary.filename };
    }

    // If not in database, check with Python service
    try {
      const response = await fetch(`${this.PYTHON_SERVICE_URL}/sessions`);
      if (response.ok) {
        const sessions = await response.json();
        if (sessions.active_sessions.includes(sessionId)) {
          // Session exists in Python service, get filename from there
          const sessionDetails = sessions.session_details[sessionId];
          return { filename: sessionDetails?.filename || 'Unknown' };
        }
      }
    } catch (error) {
      this.logger.log('Could not check Python service sessions:', error);
    }

    throw new BadRequestException('Invalid session ID');
  }

  private async callPythonService(
    endpoint: string,
    data: any,
    fileContent?: Buffer,
    filename?: string
  ): Promise<any> {
    try {
      let response: Response;

      if (fileContent && filename) {
        // Try different approach: send Buffer directly with proper headers
        const formData = new FormData();

        // Method 1: Try sending as Buffer directly (convert Buffer to Uint8Array for Blob)
        formData.append('file', new Blob([new Uint8Array(fileContent)], { type: 'application/pdf' }), filename);

        // Method 2: Also try sending as raw Buffer
        formData.append('file_buffer', fileContent.toString('base64'));

        // Add other data as form fields
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        // Add additional metadata
        formData.append('content_type', 'application/pdf');
        formData.append('file_size', fileContent.length.toString());
        formData.append('upload_timestamp', new Date().toISOString());
        formData.append('file_extension', filename.split('.').pop() || 'pdf');

        this.logger.log(`Sending file to AI Service: ${filename}, size: ${fileContent.length} bytes, endpoint: ${endpoint}`);

        // Try with explicit headers
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json, application/pdf',
            'X-File-Type': 'pdf',
            'X-File-Size': fileContent.length.toString(),
            'X-File-Name': filename
          },
          body: formData,
          signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
        });
      } else {
        // JSON request
        this.logger.log(`Sending JSON request to ${endpoint}:`, data);
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
        });
      }

      this.logger.log(`AI Service response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`AI Service error response: ${errorText}`);
        throw new Error(`Python service responded with status: ${response.status}, body: ${errorText}`);
      }

      const responseData = await response.json();
      this.logger.log(`AI Service success response received:`, responseData);

      // Check if response has status field, if not, treat as success
      if (responseData.status === false) {
        throw new Error(responseData.error || responseData.detail || 'Python service returned error');
      }

      // If no status field, assume success and create a default response
      if (responseData.status === undefined) {
        this.logger.log(`AI Service response has no status field, treating as success`);
        return {
          status: true,
          ...responseData
        };
      }

      return responseData;
    } catch (error) {
      this.logger.error(`Error calling AI Service: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Automatic fallback: if primary endpoint is unreachable (often localhost in dev), retry once against hosted service
      try {
        const primaryBase = this.PYTHON_SERVICE_URL;
        const isPrimaryLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(primaryBase);
        const hasFallback = Boolean(this.FALLBACK_PYTHON_SERVICE_URL);
        const alreadyUsingFallback = hasFallback ? endpoint.startsWith(this.FALLBACK_PYTHON_SERVICE_URL as string) : false;

        if (hasFallback && !alreadyUsingFallback && (isPrimaryLocalhost || (error instanceof Error && /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|fetch failed/i.test(error.message)))) {
          const fallbackEndpoint = endpoint.replace(primaryBase, this.FALLBACK_PYTHON_SERVICE_URL as string);
          this.logger.warn(`Primary AI service unreachable. Retrying against fallback: ${fallbackEndpoint}`);

          // Recurse once with fallback endpoint
          return await this.callPythonService(fallbackEndpoint, data, fileContent, filename);
        }
      } catch (fallbackError) {
        this.logger.error(`Fallback AI service call failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }

      throw new Error(`Failed to call Python service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractPageCount(fileContent: Buffer): Promise<number> {
    // Simple PDF page count extraction (basic implementation)
    // In production, you might want to use a proper PDF library
    const content = fileContent.toString('utf8', 0, Math.min(1000, fileContent.length));
    const pageMatches = content.match(/\/Count\s+(\d+)/);
    return pageMatches && pageMatches[1] ? parseInt(pageMatches[1]) : 1;
  }

  private generateFileHash(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async findExistingSummary(fileHash: string, summaryType: string): Promise<IPDFSummaryData | null> {
    return await this.pdfSummaryRepository.findByFileHash(fileHash, summaryType);
  }

  private async saveBasicSummary(
    sessionId: string,
    filename: string,
    fileSize: number,
    totalPages: number,
    fileHash: string,
    briefSummary: string,
    userId?: string,
    userIp?: string,
    userAgent?: string
  ): Promise<IPDFSummaryData> {
    const summaryData = {
      summaryId: uuidv4(),
      session_id: sessionId,
      filename,
      original_filename: filename,
      summary_type: 'brief' as const,
      summary_content: briefSummary,
      file_size_bytes: fileSize,
      total_pages: totalPages,
      file_hash: fileHash,
      ai_model_used: 'gemini',
      processing_time_ms: 0,
      chunks_processed: 1,
      user_id: userId,
      status: 'completed' as const
    };

    return await this.pdfSummaryRepository.create(summaryData);
  }

  private async saveChatHistory(
    sessionId: string,
    filename: string,
    question: string,
    answer: string,
    aiResponse: any,
    startTime: number,
    userId?: string,
    userIp?: string,
    userAgent?: string
  ): Promise<void> {
    const chatHistory = {
      chatId: uuidv4(),
      session_id: sessionId,
      user_id: userId,
      filename,
      question,
      answer,
      ai_wizard_status: aiResponse.ai_wizard_status || 'active',
      magic_level: aiResponse.magic_level || 'normal',
      ai_model_used: aiResponse.ai_model_used || 'gemini',
      response_time_ms: Date.now() - startTime,
      tokens_used: aiResponse.tokens_used || 0,
      ip_address: userIp,
      user_agent: userAgent
    };

    await this.pdfChatHistoryRepository.create(chatHistory);
  }
}
