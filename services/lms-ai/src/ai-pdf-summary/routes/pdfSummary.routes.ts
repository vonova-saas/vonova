import { Router } from 'express';
import { PDFSummaryController } from '../controllers/pdfSummary.controller';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { 
  ChatWithPDFRequestSchema,
  UploadPDFRequestSchema,
  GetSessionChatHistoryRequestSchema,
  RateChatResponseSchema
} from '../validation/pdfSummary.validation';

const router = Router();
const pdfSummaryController = new PDFSummaryController();

// Health check and service info
router.get('/health', pdfSummaryController.healthCheck);
router.get('/stats', pdfSummaryController.getServiceStats);

// PDF Summary generation and management

router.post('/upload', 
  pdfSummaryController.uploadPDF
);

// Get full summary of entire file
router.get('/summarize', pdfSummaryController.getFullSummary);

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

router.get('/session/:sessionId/chat-history', 
  pdfSummaryController.getSessionChatHistory
);

export default router;
