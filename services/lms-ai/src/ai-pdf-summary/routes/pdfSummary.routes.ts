import { Router } from 'express';
import { PDFSummaryController } from '../controllers/pdfSummary.controller';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { 
  GenerateSummaryRequestSchema, 
  GetSummaryRequestSchema,
  ChatWithPDFRequestSchema,
  UploadPDFRequestSchema,
  GetUserSummariesRequestSchema,
  GetSessionChatHistoryRequestSchema,
  RateChatResponseSchema
} from '../validation/pdfSummary.validation';

const router = Router();
const pdfSummaryController = new PDFSummaryController();

// Health check and service info
router.get('/health', pdfSummaryController.healthCheck);
router.get('/stats', pdfSummaryController.getServiceStats);

// PDF Summary generation and management
router.post('/generate', 
  validateRequest(GenerateSummaryRequestSchema), 
  pdfSummaryController.generateSummary
);

router.get('/summary/:summaryId', 
  pdfSummaryController.getSummaryById
);

router.post('/upload', 
  pdfSummaryController.uploadPDF
);

// PDF Chat functionality
router.post('/chat', 
  validateRequest(ChatWithPDFRequestSchema), 
  pdfSummaryController.chatWithPDF
);

router.post('/chat/rate', 
  validateRequest(RateChatResponseSchema), 
  pdfSummaryController.rateChatResponse
);

// User data and history
router.get('/user/:userId/summaries', 
  pdfSummaryController.getUserSummaries
);

router.get('/session/:sessionId/chat-history', 
  pdfSummaryController.getSessionChatHistory
);

export default router;
