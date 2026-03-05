import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PdfSummaryRepository } from '../database/repositories/pdf-summary.repository';
import { PdfChatHistoryRepository } from '../database/repositories/pdf-chat-history.repository';
import { PdfSummaryAudioRepository } from '../database/repositories/pdf-summary-audio.repository';
import { VoiceAskIdempotencyRepository } from '../database/repositories/voice-ask-idempotency.repository';
import { S3Service } from '../../common/services/s3.service';
import {
  IPDFSummaryRequest,
  IPDFSummaryResponse,
  IPDFSummaryData,
  IPDFChatRequest,
  IPDFChatResponse,
  IPDFUploadRequest,
  IPDFUploadResponse,
} from './interfaces/pdf-summary.interface';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class PdfSummaryService {
  private readonly logger = new Logger(PdfSummaryService.name);
  private readonly PYTHON_SERVICE_URL: string;
  private readonly FALLBACK_PYTHON_SERVICE_URL: string | undefined;
  private readonly DEFAULT_TIMEOUT = 300000; // 5 minutes

  constructor(
    private readonly pdfSummaryRepository: PdfSummaryRepository,
    private readonly pdfChatHistoryRepository: PdfChatHistoryRepository,
    private readonly pdfSummaryAudioRepository: PdfSummaryAudioRepository,
    private readonly voiceAskIdempotencyRepository: VoiceAskIdempotencyRepository,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {
    // Prefer env; default to 127.0.0.1 to avoid IPv6 (::1) resolution issues with localhost
    let primary =
      this.configService.get<string>('PDF_SUMMARY_AI_SERVICE_URL') ||
      'http://127.0.0.1:5015';
    let fallback = this.configService.get<string>(
      'FALLBACK_PDF_SUMMARY_AI_SERVICE_URL',
    );

    // Clean up URLs - handle cases where env var might contain multiple URLs or extra characters
    primary = this.cleanUrl(primary);
    fallback = fallback ? this.cleanUrl(fallback) : undefined;

    // Normalize localhost -> 127.0.0.1 to avoid IPv6 (::1) issues on Windows/Postman
    this.PYTHON_SERVICE_URL = primary
      .replace('http://localhost', 'http://127.0.0.1')
      .replace('https://localhost', 'https://127.0.0.1');
    this.FALLBACK_PYTHON_SERVICE_URL = fallback
      ? fallback
        .replace('http://localhost', 'http://127.0.0.1')
        .replace('https://localhost', 'https://127.0.0.1')
      : undefined;

    this.logger.log(
      `Python service URL configured: ${this.PYTHON_SERVICE_URL}`,
    );
    if (this.FALLBACK_PYTHON_SERVICE_URL) {
      this.logger.log(
        `Fallback Python service URL configured: ${this.FALLBACK_PYTHON_SERVICE_URL}`,
      );
    }
  }

  /**
   * Clean and validate URL string
   * Handles cases where env var might contain multiple URLs, quotes, or extra characters
   */
  private cleanUrl(url: string): string {
    if (!url) {
      return 'http://127.0.0.1:5015';
    }

    // Remove quotes if present
    url = url.trim().replace(/^["']|["']$/g, '');

    // If URL contains comma, take the first one (in case multiple URLs are provided)
    if (url.includes(',')) {
      const urls = url
        .split(',')
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
      url = urls[0];
      this.logger.warn(
        `Multiple URLs found in environment variable, using first: ${url}`,
      );
    }

    // Remove trailing slash
    url = url.replace(/\/+$/, '');

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      this.logger.error(`Invalid URL format: ${url}, using default`);
      return 'http://127.0.0.1:5015';
    }

    return url;
  }

  async chatWithPDF(
    request: IPDFChatRequest,
    userIp?: string,
    userAgent?: string,
  ): Promise<IPDFChatResponse> {
    const startTime = Date.now();

    try {
      // Validate session exists (in database or Python service)
      // Note: We allow sessions that exist in Python service even if not in database
      // (e.g., if database save failed due to duplicate key error)
      const session = await this.validateSession(request.session_id);

      // Call Python AI service for chat
      this.logger.log(
        `Calling Python service for chat with session_id: ${request.session_id}`,
      );
      const aiResponse = await this.callPythonService(
        `${this.PYTHON_SERVICE_URL}/ask`,
        {
          session_id: request.session_id,
          question: request.question,
          context_length: request.context_length || 1000,
        },
      );

      // Normalize external status/levels to internal enums
      const normalizedWizardStatus = ((): 'active' | 'inactive' | 'error' => {
        const raw = String(aiResponse.ai_wizard_status || '').toUpperCase();
        if (raw === 'SUCCESS' || raw === 'ACTIVE' || raw === '')
          return 'active';
        if (raw === 'ERROR' || raw === 'FAILED' || raw === 'FAIL')
          return 'error';
        return 'inactive';
      })();

      const normalizedMagicLevel = ((): 'normal' | 'enhanced' | 'cached' => {
        const raw = String(aiResponse.magic_level || '').toUpperCase();
        if (raw === 'MAXIMUM' || raw === 'HIGH' || raw === 'ENHANCED')
          return 'enhanced';
        if (raw === 'CACHED' || raw === 'CACHE') return 'cached';
        return 'normal';
      })();

      // Get filename from Python service response
      const responseFilename =
        aiResponse.filename || session.filename || 'Unknown';

      // Save chat history
      await this.saveChatHistory(
        request.session_id,
        responseFilename,
        request.question,
        aiResponse.answer,
        {
          ...aiResponse,
          ai_wizard_status: normalizedWizardStatus,
          magic_level: normalizedMagicLevel,
        },
        startTime,
        request.user_id,
        userIp,
        userAgent,
      );

      // Return formatted response
      return {
        status: true,
        answer: aiResponse.answer,
        session_id: request.session_id,
        filename: responseFilename,
        ...(request.user_id && { user_id: request.user_id }),
        ai_wizard_status: normalizedWizardStatus,
        magic_level: normalizedMagicLevel,
        message: aiResponse.message || 'Chat response generated successfully',
        metadata: {
          generated: new Date().toISOString(),
          ai_model_used: aiResponse.ai_model_used || 'gemini',
          response_time_ms: Date.now() - startTime,
          tokens_used: aiResponse.tokens_used || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error in PDF chat:', error);

      // Check if session expired in AI service but exists in database
      if (
        error instanceof BadRequestException &&
        error.message.includes('Session expired in AI service')
      ) {
        // Check if we have the session in database with S3 file
        const dbSummary = await this.pdfSummaryRepository.findBySessionId(
          request.session_id,
        );
        if (dbSummary && dbSummary.s3_key) {
          // Provide helpful message about re-uploading
          throw new BadRequestException(
            `Session expired in AI service (7-day TTL). Your PDF data is safely stored. ` +
            `To continue chatting, please re-upload the same PDF file. ` +
            `The system will recognize it and restore the session.`,
          );
        }
      }

      // Re-throw BadRequestException as-is (for session not found, etc.)
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Wrap other errors in InternalServerErrorException with better messages
      if (error instanceof Error) {
        if (error.message.includes('Python service responded')) {
          // Extract the actual error message
          const errorMsg = error.message.replace(
            'Python service responded with status: ',
            '',
          );
          throw new InternalServerErrorException(
            `Failed to chat with PDF: ${errorMsg}`,
          );
        }
        if (error.message.includes('Failed to call Python service')) {
          throw new InternalServerErrorException(
            `Failed to chat with PDF: ${error.message}`,
          );
        }
      }
      throw new InternalServerErrorException(
        `Failed to chat with PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async uploadPDF(
    request: IPDFUploadRequest,
    userIp?: string,
    userAgent?: string,
  ): Promise<IPDFUploadResponse> {
    const startTime = Date.now();
    const sessionId = uuidv4();

    try {
      // Validate file
      if (!request.file || request.file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are allowed');
      }

      // Normalize buffer coming over the wire (may be plain Buffer or { type: 'Buffer', data: [...] })
      let fileContent: Buffer;
      const rawBuffer = (request.file as any).buffer;

      this.logger.debug(`Raw buffer type: ${typeof rawBuffer}, isBuffer: ${Buffer.isBuffer(rawBuffer)}`);

      if (Buffer.isBuffer(rawBuffer)) {
        fileContent = rawBuffer;
      } else if (
        rawBuffer &&
        typeof rawBuffer === 'object' &&
        rawBuffer.type === 'Buffer' &&
        Array.isArray(rawBuffer.data)
      ) {
        fileContent = Buffer.from(rawBuffer.data);
      } else if (rawBuffer && typeof rawBuffer === 'object' && Array.isArray((rawBuffer as any).data)) {
        // Handle case where it's just { data: [...] } without type: 'Buffer'
        fileContent = Buffer.from((rawBuffer as any).data);
      } else {
        this.logger.error('Invalid file buffer received', {
          type: typeof rawBuffer,
          hasBuffer: !!rawBuffer,
          keys: rawBuffer ? Object.keys(rawBuffer) : [],
          rawBuffer: rawBuffer
        });
        throw new BadRequestException('Invalid file buffer received');
      }

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
        'pdfs',
      );
      const s3Url = this.s3Service.getFileUrl(s3Key);
      this.logger.log(`PDF file uploaded to S3: ${s3Key}`);

      // Note: Removed existing summary check - each upload now creates a new session
      // This ensures users always get a fresh session_id even for the same file

      // Upload to Python service with language support
      // Note: language and auto_summarize are sent as form data fields via callPythonService
      const uploadResponse = await this.callPythonService(
        `${this.PYTHON_SERVICE_URL}/upload`,
        {
          filename,
          file_size: fileSize,
          ...(request.language && { language: request.language }),
          ...(request.auto_summarize !== undefined && {
            auto_summarize: request.auto_summarize,
          }),
        },
        fileContent,
        filename,
      );

      // Use the session_id from Python service response
      const pythonSessionId = uploadResponse.session_id;

      // Save basic summary data to database
      try {
        const summaryData = await this.saveBasicSummary(
          pythonSessionId,
          filename,
          fileSize,
          totalPages,
          fileHash,
          uploadResponse.brief_summary || 'Summary will be generated on demand',
          request.user_id,
          userIp,
          userAgent,
          s3Key,
          s3Url,
          uploadResponse.language || 'en',
        );
        this.logger.log(
          `Session ${pythonSessionId} saved to database successfully`,
        );
      } catch (dbError: unknown) {
        const err = dbError as {
          code?: number;
          keyPattern?: Record<string, unknown>;
          message?: string;
        };
        if (err?.code === 11000) {
          if (err.keyPattern?.file_hash) {
            this.logger.warn(
              `Duplicate file_hash for session ${pythonSessionId}. DB may still have unique index on file_hash; session is usable.`,
            );
          } else if (err.keyPattern?.session_id) {
            this.logger.error(`Duplicate session_id: ${pythonSessionId}`);
            throw new InternalServerErrorException(
              'Session ID conflict. Please try again.',
            );
          } else {
            this.logger.error(
              `Duplicate key: ${JSON.stringify(err.keyPattern)}`,
            );
            throw dbError;
          }
        } else {
          this.logger.error(
            `Error saving summary: ${err?.message ?? 'unknown'}`,
          );
          throw dbError;
        }
      }

      return {
        status: true,
        session_id: pythonSessionId,
        brief_summary:
          uploadResponse.brief_summary || 'PDF uploaded successfully',
        ...(request.user_id && { user_id: request.user_id }),
        magic_level: uploadResponse.magic_level || 'normal',
        enchantment_status: uploadResponse.enchantment_status || 'uploaded',
        message:
          uploadResponse.message || 'PDF uploaded and processed successfully',
        metadata: {
          filename,
          file_size_bytes: fileSize,
          total_pages: totalPages,
          processing_time_ms: Date.now() - startTime,
          s3_key: s3Key,
          s3_url: s3Url,
        },
      };
    } catch (error) {
      this.logger.error('Error uploading PDF:', error);
      throw error;
    }
  }

  async getSessionChatHistory(
    sessionId: string,
    page = 1,
    limit = 20,
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

      // Clean and trim sessionId
      const cleanSessionId = sessionId.trim();

      // Validate pagination parameters
      const validPage = Math.max(1, page);
      const validLimit = Math.min(100, Math.max(1, limit));

      this.logger.log(
        `Fetching chat history for session: "${cleanSessionId}" (length: ${cleanSessionId.length}), page: ${validPage}, limit: ${validLimit}`,
      );

      const result = await this.pdfChatHistoryRepository.findBySessionId(
        cleanSessionId,
        validPage,
        validLimit,
      );

      if (result.total === 0) {
        this.logger.warn(`No chat history for session_id: "${cleanSessionId}"`);
      }
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching chat history for session ${sessionId}:`,
        error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve chat history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getFullSummary(
    sessionId: string,
    userId?: string,
    userIp?: string,
    userAgent?: string,
  ): Promise<IPDFSummaryResponse> {
    const startTime = Date.now();

    // Ensure session exists and get filename
    const session = await this.validateSession(sessionId);

    // Call AI service GET /summarize with session_id
    try {
      // Ensure PYTHON_SERVICE_URL is clean and valid
      const baseUrl = this.PYTHON_SERVICE_URL.trim().replace(/\/+$/, ''); // Remove trailing slashes
      const endpoint = `${baseUrl}/summarize?session_id=${encodeURIComponent(sessionId)}`;

      // Validate URL before making request
      try {
        new URL(endpoint);
      } catch (urlError) {
        this.logger.error(`Invalid URL constructed: ${endpoint}`);
        throw new InternalServerErrorException(
          `Failed to parse URL: ${endpoint}. Please check PDF_SUMMARY_AI_SERVICE_URL environment variable.`,
        );
      }

      this.logger.log(`Calling Python service: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;

        // Try to parse JSON error response
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.detail) {
            errorMessage = errorJson.detail;
          }
        } catch {
          // If not JSON, use the text as-is
        }

        // Handle specific error cases
        if (
          response.status === 404 &&
          errorMessage.includes('Session not found')
        ) {
          this.logger.warn(
            `Session ${sessionId} not found in Python service. Checking database for cached summary.`,
          );

          // Try to return cached summary from database if available
          const dbSummary =
            await this.pdfSummaryRepository.findBySessionId(sessionId);
          if (dbSummary && dbSummary.summary_content) {
            this.logger.log(
              `Returning cached summary from database for session ${sessionId} (session expired in AI service after 7 days)`,
            );
            // Return cached summary with note in metadata
            const cachedSummary = {
              status: true,
              summary: dbSummary.summary_content,
              summary_type: dbSummary.summary_type || 'detailed',
              filename: dbSummary.filename || session.filename || 'Unknown',
              session_id: sessionId,
              metadata: {
                generated:
                  dbSummary.updated_at?.toISOString() ||
                  new Date().toISOString(),
                ai_model_used: dbSummary.ai_model_used || 'gemini',
                processing_time_ms: Date.now() - startTime,
                file_size_bytes: dbSummary.file_size_bytes || 0,
                total_pages: dbSummary.total_pages || 0,
              },
            };
            this.logger.log(
              `Note: Summary retrieved from database cache. Session expired in AI service after 7 days.`,
            );
            return cachedSummary;
          }

          // Session expired in AI service (7-day TTL) but no cached summary
          if (dbSummary) {
            throw new BadRequestException(
              `Session expired in AI service. Sessions expire after 7 days in the AI service for performance reasons, but your session data is stored in the database. Please re-upload the PDF to recreate the session. Session ID: ${sessionId}`,
            );
          }

          // No session found anywhere
          throw new BadRequestException(
            `Session not found. The session may have expired or the AI service was restarted. ` +
            `Please re-upload the PDF to create a new session.`,
          );
        }

        throw new InternalServerErrorException(
          `AI summarize failed: ${response.status} ${errorMessage}`,
        );
      }

      const aiResponse = await response.json();

      // Get filename from Python service response, database, or use default
      const responseFilename =
        aiResponse.filename || session.filename || 'Unknown';

      return {
        status: true,
        summary: aiResponse.summary || 'Summary generated successfully',
        summary_type: aiResponse.summary_type || 'detailed',
        filename: responseFilename,
        session_id: sessionId,
        metadata: {
          generated: new Date().toISOString(),
          ai_model_used: aiResponse.ai_model_used || 'gemini',
          processing_time_ms: Date.now() - startTime,
          file_size_bytes: aiResponse.file_size_bytes || 0,
          total_pages: aiResponse.total_pages || 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error in getFullSummary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get PDF summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async rateChatResponse(
    chatId: string,
    rating: number,
    userId: string,
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      await this.pdfChatHistoryRepository.updateRating(chatId, rating);

      return {
        success: true,
        message: 'Chat response rated successfully',
        data: { chatId, rating, user_id: userId },
      };
    } catch (error) {
      this.logger.error('Error rating chat response:', error);
      throw new InternalServerErrorException('Failed to rate chat response');
    }
  }

  async deleteSession(
    sessionId: string,
    userId?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Get session from database to check ownership and get S3 key
      const session =
        await this.pdfSummaryRepository.findBySessionId(sessionId);

      // Idempotent delete: if session doesn't exist, return success
      if (!session) {
        this.logger.log(
          `Session ${sessionId} not found, returning success (idempotent delete)`,
        );
        return {
          success: true,
          message: 'Session deleted successfully (session did not exist)',
        };
      }

      // Optional: Check user ownership if userId provided
      if (userId && session.user_id && session.user_id !== userId) {
        throw new BadRequestException(
          'You do not have permission to delete this session',
        );
      }

      // 1. Delete from Python service first
      try {
        const deleteEndpoint = `${this.PYTHON_SERVICE_URL}/session/${sessionId}`;
        this.logger.log(
          `Deleting session from Python service: ${deleteEndpoint}`,
        );

        const response = await fetch(deleteEndpoint, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
        });

        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          this.logger.warn(
            `Python service deletion returned status ${response.status}: ${errorText}`,
          );
        } else {
          this.logger.log(`Session deleted from Python service: ${sessionId}`);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to delete session from Python service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        // Continue with database cleanup even if Python service fails
      }

      // 2. Delete from database (summary)
      const summaryDeleted =
        await this.pdfSummaryRepository.deleteBySessionId(sessionId);
      this.logger.log(`Summary deleted from database: ${summaryDeleted}`);

      // 3. Delete chat history
      const historyDeleted =
        await this.pdfChatHistoryRepository.deleteBySessionId(sessionId);
      this.logger.log(`Chat history deleted from database: ${historyDeleted}`);

      // 4. Delete S3 file if s3_key is stored
      if (session.s3_key) {
        try {
          const s3Deleted = await this.s3Service.deleteFile(session.s3_key);
          this.logger.log(
            `S3 file deletion ${s3Deleted ? 'succeeded' : 'failed'}: ${session.s3_key}`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to delete S3 file ${session.s3_key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          // Continue even if S3 deletion fails
        }
      }

      return {
        success: true,
        message: 'Session and all associated data deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting session:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete session');
    }
  }

  // Private helper methods
  private async validateSession(
    sessionId: string,
  ): Promise<{ filename: string }> {
    // First try to get from database
    const summary = await this.pdfSummaryRepository.findBySessionId(sessionId);
    if (summary) {
      return { filename: summary.filename };
    }

    // If not in database, the session might still exist in Python service
    // We'll allow the session to be used and let Python service validate it
    // The filename will be retrieved from Python service response or use a default
    this.logger.log(
      `Session ${sessionId} not found in database, but may exist in Python service. Proceeding with validation.`,
    );

    // Return a default filename - the actual filename will come from Python service responses
    return { filename: 'Unknown' };
  }

  private async callPythonService(
    endpoint: string,
    data: any,
    fileContent?: Buffer,
    filename?: string,
  ): Promise<any> {
    try {
      let response: Response;

      if (fileContent && filename) {
        // Try different approach: send Buffer directly with proper headers
        const formData = new FormData();

        // Method 1: Try sending as Buffer directly (convert Buffer to Uint8Array for Blob)
        formData.append(
          'file',
          new Blob([new Uint8Array(fileContent)], { type: 'application/pdf' }),
          filename,
        );

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

        this.logger.log(
          `Sending file to AI Service: ${filename}, size: ${fileContent.length} bytes, endpoint: ${endpoint}`,
        );

        // Try with explicit headers
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json, application/pdf',
            'X-File-Type': 'pdf',
            'X-File-Size': fileContent.length.toString(),
            'X-File-Name': filename,
          },
          body: formData,
          signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
        });
      } else if (endpoint.includes('/session/') && data === null) {
        // DELETE request
        this.logger.log(`Sending DELETE request to ${endpoint}`);
        response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
        });
      } else {
        // JSON request
        this.logger.log(`Sending JSON request to ${endpoint}:`, data);
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
        });
      }

      this.logger.log(`AI Service response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`AI Service error response: ${errorText}`);

        // Parse error message for better handling
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.detail) {
            errorMessage = errorJson.detail;
          }
        } catch {
          // If not JSON, use the text as-is
        }

        // Handle specific error cases
        if (
          response.status === 404 &&
          errorMessage.includes('Session not found')
        ) {
          // Check if session exists in database (may have expired in AI service after 7 days)
          const dbSummary = await this.pdfSummaryRepository.findBySessionId(
            data.session_id || data.session_id || '',
          );

          if (dbSummary) {
            // Session exists in database but expired in AI service (7-day TTL)
            throw new BadRequestException(
              `Session expired in AI service. Sessions in the AI service expire after 7 days for performance reasons, ` +
              `but your data is safely stored in the database. Please re-upload the PDF to recreate the session in the AI service. ` +
              `The session ID will remain the same: ${dbSummary.session_id}`,
            );
          } else {
            // Session doesn't exist in either place
            throw new BadRequestException(
              `Session not found. The session may have expired or the AI service was restarted. ` +
              `Please re-upload the PDF to create a new session.`,
            );
          }
        }

        throw new Error(
          `Python service responded with status: ${response.status}, body: ${errorMessage}`,
        );
      }

      const responseData = await response.json();
      this.logger.log(`AI Service success response received:`, responseData);

      // Check if response has status field, if not, treat as success
      if (responseData.status === false) {
        throw new Error(
          responseData.error ||
          responseData.detail ||
          'Python service returned error',
        );
      }

      // If no status field, assume success and create a default response
      if (responseData.status === undefined) {
        this.logger.log(
          `AI Service response has no status field, treating as success`,
        );
        return {
          status: true,
          ...responseData,
        };
      }

      return responseData;
    } catch (error) {
      // Re-throw BadRequestException and InternalServerErrorException as-is (don't wrap them)
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      this.logger.error(
        `Error calling AI Service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      // Automatic fallback: if primary endpoint is unreachable (often localhost in dev), retry once against hosted service
      try {
        const primaryBase = this.PYTHON_SERVICE_URL;
        const isPrimaryLocalhost =
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(primaryBase);
        const hasFallback = Boolean(this.FALLBACK_PYTHON_SERVICE_URL);
        const alreadyUsingFallback = hasFallback
          ? endpoint.startsWith(this.FALLBACK_PYTHON_SERVICE_URL as string)
          : false;

        // Only attempt fallback for connection errors, not for business logic errors (like 404)
        const isConnectionError =
          error instanceof Error &&
          (/ENOTFOUND|ECONNREFUSED|EAI_AGAIN|fetch failed|network/i.test(
            error.message,
          ) ||
            error.message.includes('timeout'));

        if (
          hasFallback &&
          !alreadyUsingFallback &&
          (isPrimaryLocalhost || isConnectionError)
        ) {
          const fallbackEndpoint = endpoint.replace(
            primaryBase,
            this.FALLBACK_PYTHON_SERVICE_URL as string,
          );
          this.logger.warn(
            `Primary AI service unreachable. Retrying against fallback: ${fallbackEndpoint}`,
          );

          // Recurse once with fallback endpoint
          return await this.callPythonService(
            fallbackEndpoint,
            data,
            fileContent,
            filename,
          );
        }
      } catch (fallbackError) {
        this.logger.error(
          `Fallback AI service call failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
        );
        // Re-throw BadRequestException from fallback as well
        if (
          fallbackError instanceof BadRequestException ||
          fallbackError instanceof InternalServerErrorException
        ) {
          throw fallbackError;
        }
      }

      throw new Error(
        `Failed to call Python service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Voice ask: send user voice to AI, get voice response (STT -> PDF QA -> TTS).
   * Calls Python POST /voice/ask with multipart (session_id + audio file).
   * When idempotencyKey is set, duplicate requests (same key) only create one DB record.
   */
  async voiceAsk(
    sessionId: string,
    audioBuffer: Buffer,
    mimeType: string,
    filename?: string,
    userId?: string,
    idempotencyKey?: string,
  ): Promise<{
    contentType: string;
    detectedLanguage?: string;
    userAudioS3Key?: string;
    userAudioS3Url?: string;
    aiAudioS3Key?: string;
    aiAudioS3Url?: string;
    audioRecord?: {
      audioId: string;
      session_id: string;
      user_id?: string;
      user_audio_s3_key?: string;
      user_audio_s3_url?: string;
      user_audio_mime_type?: string;
      ai_audio_s3_key?: string;
      ai_audio_s3_url?: string;
      ai_audio_content_type?: string;
      detected_language?: string;
      created_at?: Date;
      updated_at?: Date;
    };
  }> {
    if (idempotencyKey?.trim()) {
      const claimed = await this.voiceAskIdempotencyRepository.claim(
        idempotencyKey.trim(),
      );
      if (!claimed) {
        const cached = await this.waitForVoiceAskCompleted(idempotencyKey.trim());
        if (cached?.response) {
          return cached.response as Awaited<
            ReturnType<PdfSummaryService['voiceAsk']>
          >;
        }
      }
    }

    const endpoint = `${this.PYTHON_SERVICE_URL}/voice/ask`;
    const formData = new FormData();
    formData.append('session_id', sessionId.trim());
    const ext =
      filename?.split('.').pop() || (mimeType.includes('wav') ? 'wav' : 'webm');
    const safeName = filename?.trim() || `audio.${ext}`;

    const userIdSegment =
      userId && String(userId).trim()
        ? String(userId).trim()
        : 'anonymous';
    const voicePrefix = `voice/pdf-summary/${userIdSegment}/${sessionId.trim()}`;

    let userAudioS3Key: string | undefined;
    let userAudioS3Url: string | undefined;
    try {
      userAudioS3Key = await this.s3Service.uploadFile(
        audioBuffer,
        safeName,
        mimeType,
        `${voicePrefix}/user`,
      );
      try {
        userAudioS3Url = await this.s3Service.getPresignedGetUrl(userAudioS3Key);
      } catch {
        userAudioS3Url = this.s3Service.getFileUrl(userAudioS3Key);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to upload user voice to S3: ${msg}`);
    }

    formData.append(
      'audio',
      new Blob([new Uint8Array(audioBuffer)], { type: mimeType }),
      safeName,
    );

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let detail = errorText;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.detail) detail = errJson.detail;
      } catch {
        // use errorText as-is
      }
      if (response.status === 404 && detail.includes('Session not found')) {
        throw new BadRequestException(
          'Session not found. Re-upload the PDF to create a new session.',
        );
      }
      if (response.status === 422) {
        throw new BadRequestException(
          detail || 'Could not transcribe audio. Speak clearly.',
        );
      }
      throw new InternalServerErrorException(
        `Voice ask failed: ${response.status} ${detail}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const aiAudioBuffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const detectedLanguage =
      response.headers.get('X-Detected-Language') || undefined;

    let aiAudioS3Key: string | undefined;
    let aiAudioS3Url: string | undefined;
    try {
      const aiExt = contentType.includes('wav')
        ? 'wav'
        : contentType.includes('ogg')
          ? 'ogg'
          : contentType.includes('webm')
            ? 'webm'
            : 'mp3';
      const aiFilename = `ai.${aiExt}`;
      aiAudioS3Key = await this.s3Service.uploadFile(
        aiAudioBuffer,
        aiFilename,
        contentType,
        `${voicePrefix}/ai`,
      );
      try {
        aiAudioS3Url = await this.s3Service.getPresignedGetUrl(aiAudioS3Key);
      } catch {
        aiAudioS3Url = this.s3Service.getFileUrl(aiAudioS3Key);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to upload AI voice to S3: ${msg}`);
    }

    let audioRecord:
      | {
        audioId: string;
        session_id: string;
        user_id?: string;
        user_audio_s3_key?: string;
        user_audio_s3_url?: string;
        user_audio_mime_type?: string;
        ai_audio_s3_key?: string;
        ai_audio_s3_url?: string;
        ai_audio_content_type?: string;
        detected_language?: string;
        created_at?: Date;
        updated_at?: Date;
      }
      | undefined;
    try {
      const created = await this.pdfSummaryAudioRepository.create({
        audioId: uuidv4(),
        session_id: sessionId.trim(),
        ...(userId ? { user_id: userId } : {}),
        user_audio_s3_key: userAudioS3Key,
        user_audio_s3_url: userAudioS3Url,
        user_audio_mime_type: mimeType,
        ai_audio_s3_key: aiAudioS3Key,
        ai_audio_s3_url: aiAudioS3Url,
        ai_audio_content_type: contentType,
        detected_language: detectedLanguage,
      });

      audioRecord = {
        audioId: created.audioId,
        session_id: created.session_id,
        user_id: created.user_id,
        user_audio_s3_key: created.user_audio_s3_key,
        user_audio_s3_url: created.user_audio_s3_url,
        user_audio_mime_type: created.user_audio_mime_type,
        ai_audio_s3_key: created.ai_audio_s3_key,
        ai_audio_s3_url: created.ai_audio_s3_url,
        ai_audio_content_type: created.ai_audio_content_type,
        detected_language: created.detected_language,
        created_at: created.created_at,
        updated_at: created.updated_at,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to persist voice exchange in DB: ${msg}`);
    }

    const result = {
      contentType,
      detectedLanguage,
      userAudioS3Key,
      userAudioS3Url,
      aiAudioS3Key,
      aiAudioS3Url,
      audioRecord,
    };
    if (idempotencyKey?.trim()) {
      await this.voiceAskIdempotencyRepository
        .setCompleted(idempotencyKey.trim(), result as unknown as Record<string, unknown>)
        .catch((err) => {
          this.logger.warn(`Failed to set voice-ask idempotency completed: ${err instanceof Error ? err.message : String(err)}`);
        });
    }
    return result;
  }

  private async waitForVoiceAskCompleted(
    key: string,
    maxWaitMs = 60000,
    pollMs = 500,
  ): Promise<{ response?: Record<string, unknown> } | null> {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      const doc = await this.voiceAskIdempotencyRepository.get(key);
      if (doc?.status === 'completed' && doc.response) {
        return { response: doc.response as Record<string, unknown> };
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    return null;
  }

  private async extractPageCount(fileContent: Buffer): Promise<number> {
    // Simple PDF page count extraction (basic implementation)
    // In production, you might want to use a proper PDF library
    const content = fileContent.toString(
      'utf8',
      0,
      Math.min(1000, fileContent.length),
    );
    const pageMatches = content.match(/\/Count\s+(\d+)/);
    return pageMatches && pageMatches[1] ? parseInt(pageMatches[1]) : 1;
  }
  private generateFileHash(content: Buffer): string {
    // Ensure content is a Buffer
    if (!Buffer.isBuffer(content)) {
      this.logger.error(`generateFileHash received non-Buffer content: ${typeof content}`, content);

      // Try to convert if it's an object with Buffer-like structure
      if (content && typeof content === 'object') {
        try {
          const contentObj = content as any;
          // Handle { type: 'Buffer', data: [...] } format
          if (contentObj.type === 'Buffer' && Array.isArray(contentObj.data)) {
            content = Buffer.from(contentObj.data);
          }
          // Handle { data: [...] } format
          else if (Array.isArray(contentObj.data)) {
            content = Buffer.from(contentObj.data);
          }
          // Handle Uint8Array
          else if (contentObj instanceof Uint8Array) {
            content = Buffer.from(contentObj);
          }
          // Handle Array
          else if (Array.isArray(contentObj)) {
            content = Buffer.from(contentObj);
          }
          else {
            throw new Error(`Expected Buffer but received ${typeof content} with keys: ${Object.keys(contentObj)}`);
          }
        } catch (conversionError) {
          this.logger.error(`Failed to convert content to Buffer:`, conversionError);
          throw new Error(`Expected Buffer but received ${typeof content}: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`);
        }
      } else if (typeof content === 'string') {
        // Convert string to Buffer
        content = Buffer.from(content, 'utf8');
      } else {
        throw new Error(`Expected Buffer but received ${typeof content}`);
      }
    }

    // Double-check we have a Buffer before proceeding
    if (!Buffer.isBuffer(content)) {
      throw new Error(`Failed to convert content to Buffer, final type: ${typeof content}`);
    }

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async findExistingSummary(
    fileHash: string,
    summaryType: string,
  ): Promise<IPDFSummaryData | null> {
    return await this.pdfSummaryRepository.findByFileHash(
      fileHash,
      summaryType,
    );
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
    userAgent?: string,
    s3Key?: string,
    s3Url?: string,
    language?: string,
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
      status: 'completed' as const,
      ...(s3Key && { s3_key: s3Key }),
      ...(s3Url && { s3_url: s3Url }),
      ...(language && { language }),
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
    userAgent?: string,
  ): Promise<void> {
    try {
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
        user_agent: userAgent,
      };

      await this.pdfChatHistoryRepository.create(chatHistory);
      this.logger.log(
        `Chat history saved successfully for session ${sessionId}`,
      );
    } catch (error) {
      // Log error but don't throw - chat history is not critical for the response
      this.logger.error(
        `Failed to save chat history for session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't throw - allow the chat response to succeed even if history save fails
    }
  }

  /**
   * Get all sessions and PDFs for a user by user ID.
   * Returns session list with PDF metadata and nested audio_recordings per session
   * (session_id appears once per session, not repeated per recording).
   */
  async getSessionsByUserId(userId: string): Promise<{
    success: boolean;
    data: Array<{
      session_id: string;
      summaryId: string;
      filename: string;
      original_filename: string;
      brief_summary: string;
      file_size_bytes: number;
      total_pages: number;
      status: string;
      s3_key?: string;
      s3_url?: string;
      language?: string;
      created_at: Date;
      updated_at: Date;
      audio_recordings: Array<{
        audioId: string;
        user_audio_s3_key?: string;
        user_audio_s3_url?: string;
        user_audio_mime_type?: string;
        ai_audio_s3_key?: string;
        ai_audio_s3_url?: string;
        ai_audio_content_type?: string;
        detected_language?: string;
        created_at: Date;
        updated_at: Date;
      }>;
    }>;
  }> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('user_id is required');
    }
    const trimmedUserId = userId.trim();
    const docs = await this.pdfSummaryRepository.findByUserId(trimmedUserId);
    const sessionIds = docs.map((d) => d.session_id);
    let audioDocs: Awaited<ReturnType<PdfSummaryAudioRepository['findBySessionIds']>> = [];
    try {
      const [audioByUser, audioBySessions] = await Promise.all([
        this.pdfSummaryAudioRepository.findByUserId(trimmedUserId),
        this.pdfSummaryAudioRepository.findBySessionIds(sessionIds),
      ]);
      this.logger.debug(
        `getSessionsByUserId: ${sessionIds.length} session(s), audioByUser=${audioByUser.length}, audioBySessions=${audioBySessions.length}`,
      );
      const seenIds = new Set<string>();
      audioDocs = [...audioByUser];
      for (const a of audioDocs) seenIds.add(a.audioId);
      for (const a of audioBySessions) {
        if (!seenIds.has(a.audioId)) {
          seenIds.add(a.audioId);
          audioDocs.push(a);
        }
      }
      audioDocs.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } catch (err) {
      this.logger.warn(
        `Failed to load audio recordings for user ${trimmedUserId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    const recordingsBySession = new Map<
      string,
      Array<{
        audioId: string;
        user_audio_s3_key?: string;
        user_audio_s3_url?: string;
        user_audio_mime_type?: string;
        ai_audio_s3_key?: string;
        ai_audio_s3_url?: string;
        ai_audio_content_type?: string;
        detected_language?: string;
        created_at: Date;
        updated_at: Date;
      }>
    >();
    const seenAudioIdsBySession = new Map<string, Set<string>>();
    for (const a of audioDocs) {
      const sid = a.session_id;
      const aid = String(a.audioId ?? '');
      const seen = seenAudioIdsBySession.get(sid) ?? new Set<string>();
      if (aid && seen.has(aid)) continue;
      if (aid) seen.add(aid);
      seenAudioIdsBySession.set(sid, seen);
      const list = recordingsBySession.get(sid) ?? [];
      list.push({
        audioId: aid || a.audioId,
        ...(a.user_audio_s3_key && { user_audio_s3_key: a.user_audio_s3_key }),
        ...(a.user_audio_s3_url && { user_audio_s3_url: a.user_audio_s3_url }),
        ...(a.user_audio_mime_type && {
          user_audio_mime_type: a.user_audio_mime_type,
        }),
        ...(a.ai_audio_s3_key && { ai_audio_s3_key: a.ai_audio_s3_key }),
        ...(a.ai_audio_s3_url && { ai_audio_s3_url: a.ai_audio_s3_url }),
        ...(a.ai_audio_content_type && {
          ai_audio_content_type: a.ai_audio_content_type,
        }),
        ...(a.detected_language && {
          detected_language: a.detected_language,
        }),
        created_at: a.created_at,
        updated_at: a.updated_at,
      });
      recordingsBySession.set(sid, list);
    }
    const data = docs.map((d) => {
      const sessionId = d.session_id;
      const audio_recordings = recordingsBySession.get(sessionId) ?? [];
      return {
        session_id: sessionId,
        summaryId: d.summaryId,
        filename: d.filename,
        original_filename: d.original_filename,
        brief_summary: d.summary_content || '',
        file_size_bytes: d.file_size_bytes,
        total_pages: d.total_pages,
        status: d.status,
        ...(d.s3_key && { s3_key: d.s3_key }),
        ...(d.s3_url && { s3_url: d.s3_url }),
        ...(d.language && { language: d.language }),
        created_at: d.created_at,
        updated_at: d.updated_at,
        audio_recordings,
      };
    });
    return { success: true, data };
  }

  async getServiceStats(userId?: string): Promise<{
    total_summaries: number;
    total_chats: number;
    active_sessions: number;
    average_processing_time: number;
  }> {
    try {
      const [totalSummaries, totalChats, activeSessions, avgProcessingTime] =
        await Promise.all([
          this.pdfSummaryRepository.getTotalCount(userId),
          this.pdfChatHistoryRepository.getTotalCount({ userId }),
          this.pdfSummaryRepository.getActiveSessionsCount(userId),
          this.pdfSummaryRepository.getAverageProcessingTime(userId),
        ]);

      return {
        total_summaries: totalSummaries,
        total_chats: totalChats,
        active_sessions: activeSessions,
        average_processing_time: Math.round(avgProcessingTime),
      };
    } catch (error) {
      this.logger.error('Error getting service stats:', error);
      return {
        total_summaries: 0,
        total_chats: 0,
        active_sessions: 0,
        average_processing_time: 0,
      };
    }
  }

  async bulkDeleteSessions(
    sessionIds: string[],
    userId?: string,
  ): Promise<{
    total_requested: number;
    deleted: number;
    failed: number;
    failed_session_ids: string[];
  }> {
    const results = {
      total_requested: sessionIds.length,
      deleted: 0,
      failed: 0,
      failed_session_ids: [] as string[],
    };

    for (const sessionId of sessionIds) {
      try {
        await this.deleteSession(sessionId, userId);
        results.deleted++;
      } catch (error) {
        results.failed++;
        results.failed_session_ids.push(sessionId);
        this.logger.warn(
          `Failed to delete session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return results;
  }

  async getQueryAnalytics(
    startDate?: string,
    endDate?: string,
    userId?: string,
  ): Promise<{
    total_queries: number;
    average_response_time_ms: number;
    most_common_queries: Array<{ query: string; count: number }>;
    queries_by_hour: Array<{ hour: string; count: number }>;
    average_rating: number;
    language_distribution: Record<string, number>;
  }> {
    try {
      const filters: { userId?: string; startDate?: Date; endDate?: Date } = {};
      if (userId) {
        filters.userId = userId;
      }
      if (startDate) {
        filters.startDate = new Date(startDate);
      }
      if (endDate) {
        filters.endDate = new Date(endDate);
      }

      const [
        totalQueries,
        avgResponseTime,
        mostCommonQueries,
        queriesByHour,
        avgRating,
        languageDistribution,
      ] = await Promise.all([
        this.pdfChatHistoryRepository.getTotalCount(filters),
        this.pdfChatHistoryRepository.getAverageResponseTime(filters),
        this.pdfChatHistoryRepository.getMostCommonQueries(10, filters),
        this.pdfChatHistoryRepository.getQueriesByHour(filters),
        this.pdfChatHistoryRepository.getAverageRating(filters),
        this.pdfSummaryRepository.getLanguageDistribution(),
      ]);

      return {
        total_queries: totalQueries,
        average_response_time_ms: Math.round(avgResponseTime),
        most_common_queries: mostCommonQueries,
        queries_by_hour: queriesByHour,
        average_rating: Math.round(avgRating * 10) / 10,
        language_distribution: languageDistribution,
      };
    } catch (error) {
      this.logger.error('Error getting query analytics:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve query analytics',
      );
    }
  }

  /**
   * Test connection to Python AI service
   * @returns Connection status with endpoint and message
   */
  async testAiConnection(): Promise<{
    ok: boolean;
    message: string;
    endpoint: string;
  }> {
    const endpoint = `${this.PYTHON_SERVICE_URL}/health`;
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        const txt = await res.text();
        return {
          ok: false,
          message: `AI service unhealthy: ${res.status} ${txt}`,
          endpoint,
        };
      }
      const data = await res.json();
      return {
        ok: true,
        message: `AI service reachable: ${data.status || 'healthy'}`,
        endpoint,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      return {
        ok: false,
        message: `AI service not reachable: ${msg}`,
        endpoint,
      };
    }
  }
}
