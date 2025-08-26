import { Request, Response, NextFunction } from 'express';
import { PDFSummaryService } from '../services/pdfSummary.service';
import { asyncHandler } from '../../middlewares/api/asyncHandler.middleware';
import { 
  GenerateSummaryRequestSchema, 
  GetSummaryRequestSchema,
  ChatWithPDFRequestSchema,
  UploadPDFRequestSchema,
  GetUserSummariesRequestSchema,
  GetSessionChatHistoryRequestSchema,
  RateChatResponseSchema,
  PaginationQuerySchema,
  DaysQuerySchema
} from '../validation/pdfSummary.validation';
import { IPDFSummaryRequest, IPDFChatRequest } from '../models/pdfSummary.model';
import multer from 'multer';
import { MulterRequest } from '../../types/multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check mimetype
    if (file.mimetype === 'application/pdf') {
      // Additional check: verify file extension
      const fileExtension = file.originalname.toLowerCase().split('.').pop();
      if (fileExtension === 'pdf') {
        cb(null, true);
      } else {
        cb(new Error('File extension must be .pdf'));
      }
    } else {
      cb(new Error('Only PDF files are allowed. Received: ' + file.mimetype));
    }
  }
});

export class PDFSummaryController {
  private pdfSummaryService: PDFSummaryService;

  constructor() {
    this.pdfSummaryService = new PDFSummaryService();
  }

  // Error handling middleware for multer
  private handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 50MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: error.message
      });
    } else if (error) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        error: error.message
      });
    }
    return next();
  };

  /**
   * Generate PDF summary from file content or URL
   */
  generateSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = GenerateSummaryRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const validatedData = validationResult.data;
    const request: IPDFSummaryRequest = {
      summary_type: validatedData.summary_type,
      focus_areas: validatedData.focus_areas || [],
      ...(validatedData.file_url && { file_url: validatedData.file_url }),
      ...(validatedData.file_content && { file_content: validatedData.file_content }),
      ...(validatedData.max_length && { max_length: validatedData.max_length }),
      ...(validatedData.user_id && { user_id: validatedData.user_id })
    };

    const summary = await this.pdfSummaryService.generateSummary(
      request,
      req.ip,
      req.get('User-Agent')
    );

    res.status(201).json(summary);
  });

  /**
   * Get summary by ID
   */
  getSummaryById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = GetSummaryRequestSchema.safeParse({
      summaryId: req.params.summaryId
    });
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const validatedData = validationResult.data;
    const userId = (req.query.user_id as string) || (req.body.user_id as string);
    const summary = await this.pdfSummaryService.getSummaryById(
      validatedData.summaryId,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Summary retrieved successfully',
      data: summary
    });
  });

  /**
   * Chat with PDF using session ID
   */
  chatWithPDF = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = ChatWithPDFRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const validatedData = validationResult.data;
    const request: IPDFChatRequest = {
      session_id: validatedData.session_id,
      question: validatedData.question,
      ...(validatedData.user_id && { user_id: validatedData.user_id }),
      ...(validatedData.context_length && { context_length: validatedData.context_length })
    };

    const chatResponse = await this.pdfSummaryService.chatWithPDF(
      request,
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json(chatResponse);
  });

  /**
   * Upload PDF file
   */
  uploadPDF = [
    upload.single('file'),
    this.handleMulterError,
    asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const multerReq = req as MulterRequest;
      
      if (!multerReq.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      // Additional file validation
      if (multerReq.file.mimetype !== 'application/pdf') {
        res.status(400).json({
          success: false,
          message: 'Invalid file type. Only PDF files are allowed.',
          receivedType: multerReq.file.mimetype
        });
        return;
      }

      const validationResult = UploadPDFRequestSchema.safeParse({
        user_id: req.body.user_id,
        auto_summarize: req.body.auto_summarize === 'true',
        summary_type: req.body.summary_type
      });
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors
        });
        return;
      }

      const validatedData = validationResult.data;
      const request = {
        file: multerReq.file,
        ...(validatedData.user_id && { user_id: validatedData.user_id }),
        auto_summarize: validatedData.auto_summarize,
        ...(validatedData.summary_type && { summary_type: validatedData.summary_type })
      };

      const uploadResponse = await this.pdfSummaryService.uploadPDF(
        request,
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json(uploadResponse);
    })
  ];

  /**
   * Get user summaries with pagination
   */
  getUserSummaries = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = GetUserSummariesRequestSchema.safeParse({
      user_id: req.params.userId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    });
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const validatedData = validationResult.data;
    const result = await this.pdfSummaryService.getUserSummaries(
      validatedData.user_id,
      validatedData.page,
      validatedData.limit
    );

    res.status(200).json({
      success: true,
      message: 'User summaries retrieved successfully',
      data: result
    });
  });

  /**
   * Get session chat history
   */
  getSessionChatHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = GetSessionChatHistoryRequestSchema.safeParse({
      session_id: req.params.sessionId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    });
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const validatedData = validationResult.data;
    const result = await this.pdfSummaryService.getSessionChatHistory(
      validatedData.session_id,
      validatedData.page,
      validatedData.limit
    );

    res.status(200).json({
      success: true,
      message: 'Session chat history retrieved successfully',
      data: result
    });
  });

  /**
   * Rate chat response
   */
  rateChatResponse = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = RateChatResponseSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const validatedData = validationResult.data;
    
    // TODO: Implement rating functionality in service
    // const result = await this.pdfSummaryService.rateChatResponse(validatedData);

    res.status(200).json({
      success: true,
      message: 'Chat response rated successfully',
      data: { chatId: validatedData.chatId, rating: validatedData.rating }
    });
  });

  /**
   * Health check for PDF summary service
   */
  healthCheck = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(200).json({
      success: true,
      message: 'PDF Summary Service is healthy',
      timestamp: new Date().toISOString(),
      service: 'pdf-summary',
      version: '1.0.0'
    });
  });

  /**
   * Get service statistics
   */
  getServiceStats = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // TODO: Implement statistics collection
    res.status(200).json({
      success: true,
      message: 'Service statistics retrieved successfully',
      data: {
        total_summaries: 0,
        total_chats: 0,
        active_sessions: 0,
        average_processing_time: 0
      }
    });
  });
}
