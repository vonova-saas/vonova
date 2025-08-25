import { Router } from 'express';
import { roadmapController } from '../controllers/roadmap.controller';
import healthRoutes from './health.routes';
import analyticsRoutes from './analytics.routes';
import { requestLoggingMiddleware, errorLoggingMiddleware } from '../middlewares/logging.middleware';
import { healthController } from '../controllers/health.controller';

import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { 
  GenerateRoadmapRequestSchema,
  UpdateProgressRequestSchema 
} from '../validation/roadmap.validation';

const router = Router();

// Apply logging middleware to all routes
router.use(requestLoggingMiddleware);

// ============ MODULE ROUTES ============



// Analytics routes
router.use('/analytics', analyticsRoutes);

// Health routes
router.use('/health', healthRoutes);

// ============ ROADMAP ENDPOINTS ============

// Generate new roadmap
router.post('/generate', 
  validateRequest(GenerateRoadmapRequestSchema),
  roadmapController.generateRoadmap
);

// Get user's roadmaps with pagination
router.get('/user/:userId', roadmapController.getUserRoadmaps);



// Test AI service connection (specific route before generic :roadmapId)
router.get('/test-ai-connection', healthController.testAIConnection);

// Get comprehensive system status (specific route before generic :roadmapId)
router.get('/system-status', healthController.getSystemStatus);

// ============ INDIVIDUAL ROADMAP OPERATIONS ============

// Get roadmap by ID (must be last to avoid conflicts)
router.get('/:roadmapId', roadmapController.getRoadmapById);

// Update roadmap progress
router.put('/:roadmapId/progress', 
  validateRequest(UpdateProgressRequestSchema),
  roadmapController.updateProgress
);

// Apply error logging middleware
router.use(errorLoggingMiddleware);

export default router;
