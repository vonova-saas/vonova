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
    let primary = this.configService.get<string>('PDF_SUMMARY_AI_SERVICE_URL') || 'http://127.0.0.1:5015';
    let fallback = this.configService.get<string>('FALLBACK_PDF_SUMMARY_AI_SERVICE_URL');

    // Clean up URLs - handle cases where env var might contain multiple URLs or extra characters
    primary = this.cleanUrl(primary);
    fallback = fallback ? this.cleanUrl(fallback) : undefined;

    // Normalize localhost -> 127.0.0.1 to avoid IPv6 (::1) issues on Windows/Postman
    this.PYTHON_SERVICE_URL = primary.replace('http://localhost', 'http://127.0.0.1').replace('https://localhost', 'https://127.0.0.1');
    this.FALLBACK_PYTHON_SERVICE_URL = fallback ? fallback.replace('http://localhost', 'http://127.0.0.1').replace('https://localhost', 'https://127.0.0.1') : undefined as any;

    this.logger.log(`Python service URL configured: ${this.PYTHON_SERVICE_URL}`);
    if (this.FALLBACK_PYTHON_SERVICE_URL) {
      this.logger.log(`Fallback Python service URL configured: ${this.FALLBACK_PYTHON_SERVICE_URL}`);
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
      const urls = url.split(',').map(u => u.trim()).filter(u => u.length > 0);
      url = urls[0];
      this.logger.warn(`Multiple URLs found in environment variable, using first: ${url}`);
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
    userAgent?: string
  ): Promise<IPDFChatResponse> {
    const startTime = Date.now();

    try {
      // Validate session exists (in database or Python service)
      // Note: We allow sessions that exist in Python service even if not in database
      // (e.g., if database save failed due to duplicate key error)
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

      // Get filename from Python service response
      const responseFilename = aiResponse.filename || session.filename || 'Unknown';

      // Save chat history
      await this.saveChatHistory(
        request.session_id,
        responseFilename,
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
        filename: responseFilename,
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

      // Check if session expired in AI service but exists in database
      if (error instanceof BadRequestException && error.message.includes('Session expired in AI service')) {
        // Check if we have the session in database with S3 file
        const dbSummary = await this.pdfSummaryRepository.findBySessionId(request.session_id);
        if (dbSummary && dbSummary.s3_key) {
          // Provide helpful message about re-uploading
          throw new BadRequestException(
            `Session expired in AI service (7-day TTL). Your PDF data is safely stored. ` +
            `To continue chatting, please re-upload the same PDF file. ` +
            `The system will recognize it and restore the session.`
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
          const errorMsg = error.message.replace('Python service responded with status: ', '');
          throw new InternalServerErrorException(`Failed to chat with PDF: ${errorMsg}`);
        }
        if (error.message.includes('Failed to call Python service')) {
          throw new InternalServerErrorException(`Failed to chat with PDF: ${error.message}`);
        }
      }
      throw new InternalServerErrorException(
        `Failed to chat with PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
          ...(request.auto_summarize !== undefined && { auto_summarize: request.auto_summarize })
        },
        fileContent,
        filename
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
          uploadResponse.language || 'en'
        );
        this.logger.log(`Session ${pythonSessionId} saved to database successfully`);
      } catch (dbError: any) {
        // Handle duplicate key error gracefully (in case unique index still exists in DB from old schema)
        if (dbError.code === 11000) {
          if (dbError.keyPattern?.file_hash) {
            this.logger.warn(
              `Duplicate file_hash detected for session ${pythonSessionId}. ` +
              `The database still has a unique index on file_hash. ` +
              `Please run the migration to drop this index (see DATABASE_MIGRATION.md). ` +
              `The session was created in Python service and can still be used.`
            );
            // Continue - the session is still created in Python service and can be used
            // We'll just skip the database record for this upload
          } else if (dbError.keyPattern?.session_id) {
            // This shouldn't happen, but handle it just in case
            this.logger.error(`Duplicate session_id detected: ${pythonSessionId}`);
            throw new InternalServerErrorException('Session ID conflict. Please try again.');
          } else {
            // Unknown duplicate key error
            this.logger.error(`Unknown duplicate key error: ${JSON.stringify(dbError.keyPattern)}`);
            throw dbError;
          }
        } else {
          // Re-throw other database errors
          this.logger.error(`Error saving summary to database: ${dbError.message}`);
          throw dbError;
        }
      }

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

      // Clean and trim sessionId
      const cleanSessionId = sessionId.trim();

      // Validate pagination parameters
      const validPage = Math.max(1, page);
      const validLimit = Math.min(100, Math.max(1, limit));

      this.logger.log(`Fetching chat history for session: "${cleanSessionId}" (length: ${cleanSessionId.length}), page: ${validPage}, limit: ${validLimit}`);

      const result = await this.pdfChatHistoryRepository.findBySessionId(cleanSessionId, validPage, validLimit);

      this.logger.log(`Query result - Found ${result.total} total, ${result.chats.length} chats returned for session: ${cleanSessionId}`);

      // Log the actual query being executed for debugging
      if (result.total === 0) {
        this.logger.warn(`No chat history found for session_id: "${cleanSessionId}". This might indicate:`);
        this.logger.warn(`1. The session_id doesn't exist in the database`);
        this.logger.warn(`2. The session_id format doesn't match (check for extra spaces or encoding issues)`);
        this.logger.warn(`3. The collection name might be different`);
      }

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
    try {
      // Ensure PYTHON_SERVICE_URL is clean and valid
      const baseUrl = this.PYTHON_SERVICE_URL.trim().replace(/\/+$/, ''); // Remove trailing slashes
      const endpoint = `${baseUrl}/summarize?session_id=${encodeURIComponent(sessionId)}`;

      // Validate URL before making request
      try {
        new URL(endpoint);
      } catch (urlError) {
        this.logger.error(`Invalid URL constructed: ${endpoint}`);
        throw new InternalServerErrorException(`Failed to parse URL: ${endpoint}. Please check PDF_SUMMARY_AI_SERVICE_URL environment variable.`);
      }

      this.logger.log(`Calling Python service: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
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
        if (response.status === 404 && errorMessage.includes('Session not found')) {
          this.logger.warn(`Session ${sessionId} not found in Python service. Checking database for cached summary.`);

          // Try to return cached summary from database if available
          const dbSummary = await this.pdfSummaryRepository.findBySessionId(sessionId);
          if (dbSummary && dbSummary.summary_content) {
            this.logger.log(`Returning cached summary from database for session ${sessionId} (session expired in AI service after 7 days)`);
            // Return cached summary with note in metadata
            const cachedSummary = {
              status: true,
              summary: dbSummary.summary_content,
              summary_type: dbSummary.summary_type || 'detailed',
              filename: dbSummary.filename || session.filename || 'Unknown',
              session_id: sessionId,
              metadata: {
                generated: dbSummary.updated_at?.toISOString() || new Date().toISOString(),
                ai_model_used: dbSummary.ai_model_used || 'gemini',
                processing_time_ms: Date.now() - startTime,
                file_size_bytes: dbSummary.file_size_bytes || 0,
                total_pages: dbSummary.total_pages || 0
              }
            };
            this.logger.log(`Note: Summary retrieved from database cache. Session expired in AI service after 7 days.`);
            return cachedSummary;
          }

          // Session expired in AI service (7-day TTL) but no cached summary
          if (dbSummary) {
            throw new BadRequestException(
              `Session expired in AI service. Sessions expire after 7 days in the AI service for performance reasons, ` +
              `but your session data is stored in the database. Please re-upload the PDF to recreate the session. ` +
              `Session ID: ${sessionId}`
            );
          }

          // No session found anywhere
          throw new BadRequestException(
            `Session not found. The session may have expired or the AI service was restarted. ` +
            `Please re-upload the PDF to create a new session.`
          );
        }

        throw new InternalServerErrorException(`AI summarize failed: ${response.status} ${errorMessage}`);
      }

      const aiResponse = await response.json();

      // Get filename from Python service response, database, or use default
      const responseFilename = aiResponse.filename || session.filename || 'Unknown';

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
          total_pages: aiResponse.total_pages || 0
        }
      };
    } catch (error) {
      this.logger.error(`Error in getFullSummary: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get PDF summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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

  async deleteSession(
    sessionId: string,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Get session from database to check ownership and get S3 key
      const session = await this.pdfSummaryRepository.findBySessionId(sessionId);
      
      // Idempotent delete: if session doesn't exist, return success
      if (!session) {
        this.logger.log(`Session ${sessionId} not found, returning success (idempotent delete)`);
        return {
          success: true,
          message: 'Session deleted successfully (session did not exist)'
        };
      }

      // Optional: Check user ownership if userId provided
      if (userId && session.user_id && session.user_id !== userId) {
        throw new BadRequestException('You do not have permission to delete this session');
      }

      // 1. Delete from Python service first
      try {
        const deleteEndpoint = `${this.PYTHON_SERVICE_URL}/session/${sessionId}`;
        this.logger.log(`Deleting session from Python service: ${deleteEndpoint}`);

        const response = await fetch(deleteEndpoint, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
        });

        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          this.logger.warn(`Python service deletion returned status ${response.status}: ${errorText}`);
        } else {
          this.logger.log(`Session deleted from Python service: ${sessionId}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete session from Python service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue with database cleanup even if Python service fails
      }

      // 2. Delete from database (summary)
      const summaryDeleted = await this.pdfSummaryRepository.deleteBySessionId(sessionId);
      this.logger.log(`Summary deleted from database: ${summaryDeleted}`);

      // 3. Delete chat history
      const historyDeleted = await this.pdfChatHistoryRepository.deleteBySessionId(sessionId);
      this.logger.log(`Chat history deleted from database: ${historyDeleted}`);

      // 4. Delete S3 file if s3_key is stored
      if (session.s3_key) {
        try {
          const s3Deleted = await this.s3Service.deleteFile(session.s3_key);
          this.logger.log(`S3 file deletion ${s3Deleted ? 'succeeded' : 'failed'}: ${session.s3_key}`);
        } catch (error) {
          this.logger.warn(`Failed to delete S3 file ${session.s3_key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue even if S3 deletion fails
        }
      }

      return {
        success: true,
        message: 'Session and all associated data deleted successfully'
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
  private async validateSession(sessionId: string): Promise<{ filename: string }> {
    // First try to get from database
    const summary = await this.pdfSummaryRepository.findBySessionId(sessionId);
    if (summary) {
      return { filename: summary.filename };
    }

    // If not in database, the session might still exist in Python service
    // We'll allow the session to be used and let Python service validate it
    // The filename will be retrieved from Python service response or use a default
    this.logger.log(`Session ${sessionId} not found in database, but may exist in Python service. Proceeding with validation.`);

    // Return a default filename - the actual filename will come from Python service responses
    return { filename: 'Unknown' };
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
      } else if (endpoint.includes('/session/') && data === null) {
        // DELETE request
        this.logger.log(`Sending DELETE request to ${endpoint}`);
        response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json'
          },
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
        if (response.status === 404 && errorMessage.includes('Session not found')) {
          // Check if session exists in database (may have expired in AI service after 7 days)
          const dbSummary = await this.pdfSummaryRepository.findBySessionId(
            data.session_id || (data as any).session_id || ''
          );

          if (dbSummary) {
            // Session exists in database but expired in AI service (7-day TTL)
            throw new BadRequestException(
              `Session expired in AI service. Sessions in the AI service expire after 7 days for performance reasons, ` +
              `but your data is safely stored in the database. Please re-upload the PDF to recreate the session in the AI service. ` +
              `The session ID will remain the same: ${dbSummary.session_id}`
            );
          } else {
            // Session doesn't exist in either place
            throw new BadRequestException(
              `Session not found. The session may have expired or the AI service was restarted. ` +
              `Please re-upload the PDF to create a new session.`
            );
          }
        }

        throw new Error(`Python service responded with status: ${response.status}, body: ${errorMessage}`);
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
      // Re-throw BadRequestException and InternalServerErrorException as-is (don't wrap them)
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(`Error calling AI Service: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Automatic fallback: if primary endpoint is unreachable (often localhost in dev), retry once against hosted service
      try {
        const primaryBase = this.PYTHON_SERVICE_URL;
        const isPrimaryLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(primaryBase);
        const hasFallback = Boolean(this.FALLBACK_PYTHON_SERVICE_URL);
        const alreadyUsingFallback = hasFallback ? endpoint.startsWith(this.FALLBACK_PYTHON_SERVICE_URL as string) : false;

        // Only attempt fallback for connection errors, not for business logic errors (like 404)
        const isConnectionError = error instanceof Error && (
          /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|fetch failed|network/i.test(error.message) ||
          error.message.includes('timeout')
        );

        if (hasFallback && !alreadyUsingFallback && (isPrimaryLocalhost || isConnectionError)) {
          const fallbackEndpoint = endpoint.replace(primaryBase, this.FALLBACK_PYTHON_SERVICE_URL as string);
          this.logger.warn(`Primary AI service unreachable. Retrying against fallback: ${fallbackEndpoint}`);

          // Recurse once with fallback endpoint
          return await this.callPythonService(fallbackEndpoint, data, fileContent, filename);
        }
      } catch (fallbackError) {
        this.logger.error(`Fallback AI service call failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        // Re-throw BadRequestException from fallback as well
        if (fallbackError instanceof BadRequestException || fallbackError instanceof InternalServerErrorException) {
          throw fallbackError;
        }
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
    userAgent?: string,
    s3Key?: string,
    s3Url?: string,
    language?: string
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
      ...(language && { language })
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
        user_agent: userAgent
      };

      await this.pdfChatHistoryRepository.create(chatHistory);
      this.logger.log(`Chat history saved successfully for session ${sessionId}`);
    } catch (error) {
      // Log error but don't throw - chat history is not critical for the response
      this.logger.error(`Failed to save chat history for session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw - allow the chat response to succeed even if history save fails
    }
  }

  async getServiceStats(): Promise<{
    total_summaries: number;
    total_chats: number;
    active_sessions: number;
    average_processing_time: number;
  }> {
    try {
      const [totalSummaries, totalChats, activeSessions, avgProcessingTime] = await Promise.all([
        this.pdfSummaryRepository.getTotalCount(),
        this.pdfChatHistoryRepository.getTotalCount(),
        this.pdfSummaryRepository.getActiveSessionsCount(),
        this.pdfSummaryRepository.getAverageProcessingTime()
      ]);

      return {
        total_summaries: totalSummaries,
        total_chats: totalChats,
        active_sessions: activeSessions,
        average_processing_time: Math.round(avgProcessingTime)
      };
    } catch (error) {
      this.logger.error('Error getting service stats:', error);
      return {
        total_summaries: 0,
        total_chats: 0,
        active_sessions: 0,
        average_processing_time: 0
      };
    }
  }

  async bulkDeleteSessions(
    sessionIds: string[],
    userId?: string
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
      failed_session_ids: [] as string[]
    };

    for (const sessionId of sessionIds) {
      try {
        await this.deleteSession(sessionId, userId);
        results.deleted++;
      } catch (error) {
        results.failed++;
        results.failed_session_ids.push(sessionId);
        this.logger.warn(`Failed to delete session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  async getQueryAnalytics(
    startDate?: string,
    endDate?: string,
    userId?: string
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
        languageDistribution
      ] = await Promise.all([
        this.pdfChatHistoryRepository.getTotalCount(filters),
        this.pdfChatHistoryRepository.getAverageResponseTime(filters),
        this.pdfChatHistoryRepository.getMostCommonQueries(10, filters),
        this.pdfChatHistoryRepository.getQueriesByHour(filters),
        this.pdfChatHistoryRepository.getAverageRating(filters),
        this.pdfSummaryRepository.getLanguageDistribution()
      ]);

      return {
        total_queries: totalQueries,
        average_response_time_ms: Math.round(avgResponseTime),
        most_common_queries: mostCommonQueries,
        queries_by_hour: queriesByHour,
        average_rating: Math.round(avgRating * 10) / 10,
        language_distribution: languageDistribution
      };
    } catch (error) {
      this.logger.error('Error getting query analytics:', error);
      throw new InternalServerErrorException('Failed to retrieve query analytics');
    }
  }
}
