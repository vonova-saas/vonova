import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { corsProtectionMiddleware } from '../../middlewares/security/cors-protection.middleware';
import { botProtectionMiddleware } from '../../middlewares/security/bot-protection.middleware';

const router = Router();

// Apply security middleware to all analytics routes
router.use(corsProtectionMiddleware);
router.use(botProtectionMiddleware);

// ============ ANALYTICS ENDPOINTS ============

// Get popular topics
router.get('/popular-topics', analyticsController.getPopularTopics);

// Get roadmap analytics
router.get('/:roadmapId', analyticsController.getRoadmapAnalytics);

// Get user analytics
router.get('/user/:userId', analyticsController.getUserAnalytics);

export default router;
