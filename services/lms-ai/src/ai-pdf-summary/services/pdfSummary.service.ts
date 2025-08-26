import { 
  IPDFSummaryRequest, 
  IPDFSummaryResponse, 
  IPDFSummaryData,
  IPDFChatRequest,
  IPDFChatResponse,
  IPDFUploadRequest,
  IPDFUploadResponse
} from '../models/pdfSummary.model';
import PDFSummaryModel from '../models/pdfSummary.model';
import PDFChatHistoryModel from '../models/pdfChatHistory.model';
import { v4 as uuidv4 } from 'uuid';
import { AppError, BadRequestException, InternalServerException } from '../../utils/appError';
import { HTTPSTATUS } from '../../config/http.config';
import { Env } from '../../config/env.config';
import { 
  logAIServiceCall, 
  logDatabaseOperation, 
  logPerformance, 
  logUserActivity 
} from '../utils/logger';
import crypto from 'crypto';

/**
 * PDF Summary Service
 * Handles AI-powered PDF processing, summarization, and chat functionality
 */
export class PDFSummaryService {
  private readonly PYTHON_SERVICE_URL: string;
  private readonly DEFAULT_TIMEOUT = 300000; // 5 minutes timeout

  constructor() {
    this.PYTHON_SERVICE_URL = Env.PDF_SUMMARY_AI_SERVICE_URL || 'http://localhost:5001';
  }

  /**
   * Generate PDF summary using AI
   */
  async generateSummary(request: IPDFSummaryRequest, userIp?: string, userAgent?: string): Promise<IPDFSummaryResponse> {
    const startTime = Date.now();
    const summaryId = uuidv4();
    const sessionId = uuidv4();
    let filename = 'unknown';
    
    try {
      // Log request start
      console.log('Starting PDF summary generation', {
        summary_type: request.summary_type,
        user_id: request.user_id,
        summaryId,
        sessionId
      });

      // Validate request
      this.validateSummaryRequest(request);

      // Process file content or URL
      let fileContent: Buffer;
      let fileSize: number;
      let totalPages: number;

      if (request.file_content) {
        fileContent = request.file_content;
        filename = `uploaded_${Date.now()}.pdf`;
        fileSize = fileContent.length;
        totalPages = await this.extractPageCount(fileContent);
      } else if (request.file_url) {
        const fileData = await this.downloadFileFromUrl(request.file_url);
        fileContent = fileData.content;
        filename = fileData.filename;
        fileSize = fileData.content.length;
        totalPages = await this.extractPageCount(fileData.content);
      } else {
        throw new BadRequestException('Either file_content or file_url must be provided');
      }

      // Generate file hash
      const fileHash = this.generateFileHash(fileContent);

      // Check for existing summary with same hash
      const existingSummary = await this.findExistingSummary(fileHash, request.summary_type);
      if (existingSummary) {
        return this.formatSummaryResponse(existingSummary, sessionId);
      }

      // Call Python AI service
      const aiResponse = await this.callPythonService(
        `${this.PYTHON_SERVICE_URL}/summarize`,
        {
          summary_type: request.summary_type,
          focus_areas: request.focus_areas?.join(', ') || null,
          max_length: request.max_length || 1000
        },
        fileContent,
        filename
      );

      // Process and save summary
      const summaryData = await this.processAndSaveSummary(
        aiResponse,
        request,
        summaryId,
        sessionId,
        filename,
        fileSize,
        totalPages,
        fileHash,
        startTime,
        userIp,
        userAgent
      );

      // Return formatted response
      return this.formatSummaryResponse(summaryData, sessionId);

    } catch (error) {
      console.error('Error generating PDF summary:', error);
      
      // Save failed summary attempt
      await this.saveFailedSummary(
        request,
        summaryId,
        sessionId,
        filename,
        error instanceof Error ? error.message : 'Unknown error',
        userIp,
        userAgent
      );

      throw error;
    }
  }

  /**
   * Chat with PDF using AI
   */
  async chatWithPDF(request: IPDFChatRequest, userIp?: string, userAgent?: string): Promise<IPDFChatResponse> {
    const startTime = Date.now();
    
    try {
      // Validate session exists
      const session = await this.validateSession(request.session_id);
      
      // Call Python AI service for chat
      console.log(`Calling Python service for chat with session_id: ${request.session_id}`);
      const aiResponse = await this.callPythonService(
        `${this.PYTHON_SERVICE_URL}/ask`, // Use the correct endpoint
        {
          session_id: request.session_id,
          question: request.question,
          context_length: request.context_length || 1000
        }
      );

      // Save chat history
      await this.saveChatHistory(
        request.session_id,
        session.filename,
        request.question,
        aiResponse.answer,
        aiResponse,
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
        ai_wizard_status: aiResponse.ai_wizard_status || 'active',
        magic_level: aiResponse.magic_level || 'normal',
        message: aiResponse.message || 'Chat response generated successfully',
        metadata: {
          generated: new Date().toISOString(),
          ai_model_used: aiResponse.ai_model_used || 'gemini',
          response_time_ms: Date.now() - startTime,
          tokens_used: aiResponse.tokens_used || 0
        }
      };

    } catch (error) {
      console.error('Error in PDF chat:', error);
      throw error;
    }
  }

  /**
   * Upload PDF and optionally generate summary
   */
  async uploadPDF(request: IPDFUploadRequest, userIp?: string, userAgent?: string): Promise<IPDFUploadResponse> {
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
            processing_time_ms: 0
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
        pythonSessionId, // Use Python service session ID instead of generated one
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
        session_id: pythonSessionId, // Use Python service session ID
        brief_summary: uploadResponse.brief_summary || 'PDF uploaded successfully',
        magic_level: uploadResponse.magic_level || 'normal',
        enchantment_status: uploadResponse.enchantment_status || 'uploaded',
        message: uploadResponse.message || 'PDF uploaded and processed successfully',
        metadata: {
          filename,
          file_size_bytes: fileSize,
          total_pages: totalPages,
          processing_time_ms: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  }

  /**
   * Get summary by ID
   */
  async getSummaryById(summaryId: string, userId?: string): Promise<IPDFSummaryResponse> {
    const summary = await PDFSummaryModel.findOne({ summaryId });

    if (!summary) {
      throw new AppError('Summary not found', HTTPSTATUS.NOT_FOUND);
    }

    if (userId && summary.user_id && summary.user_id !== userId) {
      throw new AppError('Access denied', HTTPSTATUS.FORBIDDEN);
    }

    return this.formatSummaryResponse(summary, summary.session_id);
  }

  /**
   * Get user summaries with pagination
   */
  async getUserSummaries(userId: string, page = 1, limit = 10): Promise<{
    summaries: IPDFSummaryResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [summaries, total] = await Promise.all([
      PDFSummaryModel.find({ user_id: userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      PDFSummaryModel.countDocuments({ user_id: userId })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      summaries: summaries.map((summary: any) => this.formatSummaryResponse(summary, summary.session_id)),
      total,
      page,
      totalPages
    };
  }

  /**
   * Get session chat history
   */
  async getSessionChatHistory(sessionId: string, page = 1, limit = 20): Promise<{
    chats: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      PDFChatHistoryModel.find({ session_id: sessionId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      PDFChatHistoryModel.countDocuments({ session_id: sessionId })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      chats,
      total,
      page,
      totalPages
    };
  }

  // Private helper methods
  private validateSummaryRequest(request: IPDFSummaryRequest): void {
    if (!request.file_url && !request.file_content) {
      throw new BadRequestException('Either file_url or file_content must be provided');
    }

    if (request.max_length && (request.max_length < 100 || request.max_length > 10000)) {
      throw new BadRequestException('Max length must be between 100 and 10000 characters');
    }

    if (request.focus_areas && request.focus_areas.length > 10) {
      throw new BadRequestException('Maximum 10 focus areas allowed');
    }
  }

  private async downloadFileFromUrl(url: string): Promise<{ content: Buffer; filename: string }> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      const content = Buffer.from(await response.arrayBuffer());
      const filename = url.split('/').pop() || `downloaded_${Date.now()}.pdf`;
      
      return { content, filename };
    } catch (error) {
      throw new BadRequestException(`Failed to download file from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    return await PDFSummaryModel.findOne({ 
      file_hash: fileHash, 
      summary_type: summaryType,
      status: 'completed'
    });
  }

  private async callPythonService(endpoint: string, data: any, fileContent?: Buffer, filename?: string): Promise<any> {
    try {
      let response: Response;
      
      if (fileContent && filename) {
        // Try different approach: send Buffer directly with proper headers
        const formData = new FormData();
        
        // Method 1: Try sending as Buffer directly
        formData.append('file', new Blob([fileContent], { type: 'application/pdf' }), filename);
        
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

        console.log(`Sending file to AI Service: ${filename}, size: ${fileContent.length} bytes, endpoint: ${endpoint}`);
        console.log(`Form data contains: file, file_buffer, content_type, file_size, upload_timestamp, file_extension, and ${Object.keys(data).length} additional fields`);

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
        console.log(`Sending JSON request to ${endpoint}:`, data);
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

      console.log(`AI Service response status: ${response.status}`);
      console.log(`AI Service response headers: ${response.headers.get('content-type') || 'no content-type'}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI Service error response: ${errorText}`);
        throw new Error(`Python service responded with status: ${response.status}, body: ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`AI Service success response received:`, responseData);
      
      // Check if response has status field, if not, treat as success
      if (responseData.status === false) {
        throw new Error(responseData.error || responseData.detail || 'Python service returned error');
      }
      
      // If no status field, assume success and create a default response
      if (responseData.status === undefined) {
        console.log(`AI Service response has no status field, treating as success`);
        return {
          status: true,
          ...responseData
        };
      }

      return responseData;
    } catch (error) {
      console.error(`Error calling AI Service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to call Python service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processAndSaveSummary(
    aiResponse: any,
    request: IPDFSummaryRequest,
    summaryId: string,
    sessionId: string,
    filename: string,
    fileSize: number,
    totalPages: number,
    fileHash: string,
    startTime: number,
    userIp?: string,
    userAgent?: string
  ): Promise<IPDFSummaryData> {
    const summaryData = new PDFSummaryModel({
      summaryId,
      session_id: sessionId,
      filename,
      original_filename: filename,
      summary_type: request.summary_type,
      summary_content: aiResponse.summary || 'Summary generated successfully',
      focus_areas: request.focus_areas,
      max_length: request.max_length,
      file_size_bytes: fileSize,
      total_pages: totalPages,
      file_hash: fileHash,
      ai_model_used: aiResponse.ai_model_used || 'gemini',
      processing_time_ms: Date.now() - startTime,
      chunks_processed: aiResponse.chunks_processed || 1,
      user_id: request.user_id,
      status: 'completed'
    });

    await summaryData.save();

    // Log user activity
    if (request.user_id) {
      logUserActivity(request.user_id, 'pdf_summary_generated', summaryId, {
        summary_type: request.summary_type,
        filename,
        processing_time_ms: Date.now() - startTime
      });
    }

    return summaryData;
  }

  private async saveFailedSummary(
    request: IPDFSummaryRequest,
    summaryId: string,
    sessionId: string,
    filename: string,
    errorMessage: string,
    userIp?: string,
    userAgent?: string
  ): Promise<void> {
    const summaryData = new PDFSummaryModel({
      summaryId,
      session_id: sessionId,
      filename,
      original_filename: filename,
      summary_type: request.summary_type,
      summary_content: 'Summary generation failed',
      file_size_bytes: 0,
      total_pages: 0,
      file_hash: '',
      ai_model_used: 'unknown',
      processing_time_ms: 0,
      chunks_processed: 0,
      user_id: request.user_id,
      status: 'failed',
      error_message: errorMessage,
      retry_count: 0
    });

    await summaryData.save();
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
    const summaryData = new PDFSummaryModel({
      summaryId: uuidv4(),
      session_id: sessionId,
      filename,
      original_filename: filename,
      summary_type: 'brief',
      summary_content: briefSummary,
      file_size_bytes: fileSize,
      total_pages: totalPages,
      file_hash: fileHash,
      ai_model_used: 'gemini',
      processing_time_ms: 0,
      chunks_processed: 1,
      user_id: userId,
      status: 'completed'
    });

    await summaryData.save();
    return summaryData;
  }

  private async validateSession(sessionId: string): Promise<{ filename: string }> {
    // First try to get from database
    const summary = await PDFSummaryModel.findOne({ session_id: sessionId });
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
      console.log('Could not check Python service sessions:', error);
    }
    
    throw new BadRequestException('Invalid session ID');
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
    const chatHistory = new PDFChatHistoryModel({
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
    });

    await chatHistory.save();
  }

  private formatSummaryResponse(summary: IPDFSummaryData, sessionId: string): IPDFSummaryResponse {
    return {
      status: true,
      summary: summary.summary_content,
      summary_type: summary.summary_type,
      filename: summary.filename,
      session_id: sessionId,
      metadata: {
        generated: summary.created_at.toISOString(),
        ai_model_used: summary.ai_model_used,
        processing_time_ms: summary.processing_time_ms,
        file_size_bytes: summary.file_size_bytes,
        total_pages: summary.total_pages
      },
      summary_data: summary
    };
  }
}
