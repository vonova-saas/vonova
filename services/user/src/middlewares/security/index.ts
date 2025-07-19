// middlewares/security/index.ts

export { createBotProtectionMiddleware, botProtectionMiddleware, type BotProtectionConfig } from './bot-protection.middleware';
export { createCORSProtectionMiddleware, corsProtectionMiddleware, type CORSConfig } from './cors-protection.middleware';

// Combined middleware for complete NoSQL protection
import { RequestHandler } from 'express';
import { createCORSProtectionMiddleware, corsProtectionMiddleware, CORSConfig } from './cors-protection.middleware';
import { createBotProtectionMiddleware, botProtectionMiddleware, BotProtectionConfig } from './bot-protection.middleware';

// ===== COMPREHENSIVE SECURITY STACK =====

/**
 * Configuration for the complete security stack
 */
export interface SecurityStackConfig {
  cors?: CORSConfig;
  bot?: BotProtectionConfig;
  /** Skip specific security layers */
  skipLayers?: ('cors' | 'ddos' | 'bot' | 'rateLimit' | 'noSQL' | 'xss')[];
  /** Custom order for security layers (default order is recommended) */
  customOrder?: ('cors' | 'ddos' | 'bot' | 'rateLimit' | 'noSQL' | 'xss')[];
}

/**
 * Creates a comprehensive security stack with all protection layers
 * @param config - Configuration for the security stack
 * @returns Array of middleware functions in the correct order
 */
export function createSecurityStack(config: SecurityStackConfig = {}): RequestHandler[] {
  const {
    cors = {},
    bot = {},
    skipLayers = [],
    customOrder
  } = config;

  // Define the recommended order of security layers
  const defaultOrder: Array<'cors' | 'ddos' | 'bot' | 'rateLimit' | 'noSQL' | 'xss'> = [
    'cors',      // 1. CORS first (handles preflight requests)
    'ddos',      // 2. DDoS protection (IP-based rate limiting)
    'bot',       // 3. Bot protection (user agent filtering)
    'rateLimit', // 4. General rate limiting
    'noSQL',     // 5. NoSQL injection protection
    'xss'        // 6. XSS protection (sanitizes input)
  ];

  const order = customOrder || defaultOrder;
  const middlewareStack: RequestHandler[] = [];

  // Build middleware stack based on order and skip settings
  order.forEach(layer => {
    if (skipLayers.includes(layer)) return;

    switch (layer) {
      case 'cors':
        middlewareStack.push(createCORSProtectionMiddleware(cors));
        break;
        break;
      case 'bot':
        middlewareStack.push(createBotProtectionMiddleware(bot));
        break;
    }
  });

  return middlewareStack;
}

/**
 * Pre-configured comprehensive security stack with default settings
 * Provides enterprise-grade security protection
 */
export const securityStack = createSecurityStack();

/**
 * Apply security stack to an Express app
 * @param app - Express application instance
 * @param config - Security stack configuration
 */
export function applySecurityStack(app: any, config: SecurityStackConfig = {}): void {
  const stack = createSecurityStack(config);
  stack.forEach(middleware => app.use(middleware));
}

/**
 * Individual security layers for selective use
 */
export const securityLayers = {
  cors: corsProtectionMiddleware,
  bot: botProtectionMiddleware,
} as const;
