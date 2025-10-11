import { Router } from 'express';
import { roadmapController } from '../controllers/roadmap.controller';
import healthRoutes from './health.routes';
import { requestLoggingMiddleware, errorLoggingMiddleware } from '../middlewares/logging.middleware';
import { healthController } from '../controllers/health.controller';

import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { 
  GenerateRoadmapRequestSchema,
  UpdateProgressRequestSchema 
} from '../validation/roadmap.validation';
import { isAuthenticatedOrSignedContext } from '../../middlewares/auth/verifySignedContext.middleware';

const router = Router();

// Apply logging middleware to all routes
router.use(requestLoggingMiddleware);

// ============ MODULE ROUTES ============
// Health routes
router.use('/health', healthRoutes);


// Apply authentication to all settings routes
// router.use(isAuthenticatedOrSignedContext);

// ============ ROADMAP ENDPOINTS ============

// Generate new roadmap
router.post('/generate', 
  validateRequest(GenerateRoadmapRequestSchema),
  roadmapController.generateRoadmap
);

// Removed: Get user's roadmaps with pagination



// Test AI service connection (specific route before generic :roadmapId)
router.get('/test-ai-connection', healthController.testAIConnection);

// Get comprehensive system status (specific route before generic :roadmapId)
router.get('/system-status', healthController.getSystemStatus);

// ============ INDIVIDUAL ROADMAP OPERATIONS ============

// Get roadmap by ID (must be last to avoid conflicts)
router.get('/:roadmapId/:userId', roadmapController.getRoadmapById);

// Update roadmap progress
router.put('/:roadmapId/progress/:userId', 
  validateRequest(UpdateProgressRequestSchema),
  roadmapController.updateProgress
);

// Apply error logging middleware
router.use(errorLoggingMiddleware);

export default router;
