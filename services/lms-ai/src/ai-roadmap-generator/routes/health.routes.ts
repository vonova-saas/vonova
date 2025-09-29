import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { corsProtectionMiddleware } from '../../middlewares/security/cors-protection.middleware';
import { createBotProtectionMiddleware } from '../../middlewares/security/bot-protection.middleware';

const router = Router();

// Apply security middleware to all health routes
router.use(corsProtectionMiddleware);
// Skip bot protection for health and diagnostics endpoints to allow curl and tooling
router.use(
  createBotProtectionMiddleware({
    skipRoutes: [
      '/',
      '/test-ai-connection',
      '/system-status'
    ]
  })
);

// ============ HEALTH & MONITORING ENDPOINTS ============

// Service health check
router.get('/', healthController.healthCheck);

// Test AI service connection
router.get('/test-ai-connection', healthController.testAIConnection);

// Get comprehensive system status
router.get('/system-status', healthController.getSystemStatus);

export default router;
