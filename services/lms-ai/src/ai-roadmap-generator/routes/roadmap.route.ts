import { Router } from 'express';
import { roadmapController } from '../controllers/roadmap.controller';
import { healthController } from '../controllers/health.controller';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { 
  GenerateRoadmapRequestSchema,
  UpdateProgressRequestSchema 
} from '../validation/roadmap.validation';
import { corsProtectionMiddleware } from '../../middlewares/security/cors-protection.middleware';
import { botProtectionMiddleware } from '../../middlewares/security/bot-protection.middleware';

const router = Router();

// Apply security middleware to all routes
router.use(corsProtectionMiddleware);
router.use(botProtectionMiddleware);

// ============ ROADMAP ENDPOINTS ============

// Generate new roadmap
router.post('/generate', 
  validateRequest(GenerateRoadmapRequestSchema),
  roadmapController.generateRoadmap
);

// ============ HEALTH & MONITORING ============

// Service health check
router.get('/health', roadmapController.healthCheck);

// Test AI service connection
router.get('/test-ai-connection', healthController.testAIConnection);

// Get comprehensive system status
router.get('/system-status', healthController.getSystemStatus);

// ============ ANALYTICS & STATISTICS ============

// Get popular topics
router.get('/popular-topics', roadmapController.getPopularTopics);

// Get global statistics (Admin)
router.get('/stats', roadmapController.getGlobalStats);

// Search roadmaps (Future feature)
router.get('/search', roadmapController.searchRoadmaps);

// ============ USER & ROADMAP MANAGEMENT ============

// Get user's roadmaps with pagination
router.get('/user/:userId', roadmapController.getUserRoadmaps);

// ============ INDIVIDUAL ROADMAP OPERATIONS ============

// Get roadmap by ID (must be last to avoid conflicts)
router.get('/:roadmapId', roadmapController.getRoadmapById);

// Update roadmap progress
router.put('/:roadmapId/progress', 
  validateRequest(UpdateProgressRequestSchema),
  roadmapController.updateProgress
);

// Get roadmap analytics
router.get('/:roadmapId/analytics', roadmapController.getRoadmapAnalytics);

export default router;