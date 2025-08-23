import { Router } from 'express';
import indexRoutes from './index.routes';
import { corsProtectionMiddleware } from '../../middlewares/security/cors-protection.middleware';
import { botProtectionMiddleware } from '../../middlewares/security/bot-protection.middleware';

const router = Router();

// Apply security middleware to all routes
router.use(corsProtectionMiddleware);
router.use(botProtectionMiddleware);

// Use the modular route structure from the routes folder
router.use('/', indexRoutes);

export default router;