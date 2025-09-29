import { Router } from 'express';
import indexRoutes from './index.routes';
import { corsProtectionMiddleware } from '../../middlewares/security/cors-protection.middleware';
import { createBotProtectionMiddleware } from '../../middlewares/security/bot-protection.middleware';

const router = Router();

// Apply security middleware to all routes
router.use(corsProtectionMiddleware);
// Allow diagnostics routes to bypass bot UA blocking (curl, monitors)
router.use(
  createBotProtectionMiddleware({
    skipRoutes: [
      '/health',
      '/test-ai-connection',
      '/system-status'
    ]
  })
);

// Use the modular route structure from the routes folder
router.use('/', indexRoutes);

export default router;