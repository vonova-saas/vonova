// middlewares/security/index.ts

export {
  createNoSQLSanitizationMiddleware,
  noSQLSanitizationMiddleware,
  type SanitizationConfig,
  type SanitizationLogData,
} from './noSQLSanitization.middleware';

export {
  createNoSQLDetectionMiddleware,
  noSQLDetectionMiddleware,
  type DetectionConfig,
  type DetectionLogData,
} from './noSQLDetection.middleware';

export { createRateLimitMiddleware, rateLimitMiddleware, type RateLimitConfig } from './rate-limiting.middleware';
export { createBotProtectionMiddleware, botProtectionMiddleware, type BotProtectionConfig } from './bot-protection.middleware';
export { createDDOSProtectionMiddleware, ddosProtectionMiddleware, type DDOSProtectionConfig } from './ddos-protection.middleware';
export { createInputValidationMiddleware, type InputValidationConfig, type InputValidationRule } from './input-validation.middleware';
export { createCORSProtectionMiddleware, corsProtectionMiddleware, type CORSConfig } from './cors-protection.middleware';

// XSS Protection
export { default as xssProtection, createXSSProtection, XSSProtectionConfig, SanitizationLogData as XSSSanitizationLogData } from './xssProtection.middleware';

// Combined middleware for complete NoSQL protection
import { RequestHandler } from 'express';
import { createNoSQLSanitizationMiddleware, SanitizationConfig } from './noSQLSanitization.middleware';
import { createNoSQLDetectionMiddleware, DetectionConfig } from './noSQLDetection.middleware';
import { createCORSProtectionMiddleware, corsProtectionMiddleware, CORSConfig } from './cors-protection.middleware';
import { createDDOSProtectionMiddleware, ddosProtectionMiddleware, DDOSProtectionConfig } from './ddos-protection.middleware';
import { createBotProtectionMiddleware, botProtectionMiddleware, BotProtectionConfig } from './bot-protection.middleware';
import { createRateLimitMiddleware, rateLimitMiddleware, RateLimitConfig } from './rate-limiting.middleware';
import { createXSSProtection, default as xssProtection, XSSProtectionConfig } from './xssProtection.middleware';

/**
 * Configuration for combined NoSQL protection middleware
 */
export interface NoSQLProtectionConfig {
  sanitization?: SanitizationConfig;
  detection?: DetectionConfig;
  /** Whether to run detection before sanitization (default: true) */
  detectFirst?: boolean;
}

/**
 * Creates a combined middleware that provides both detection and sanitization
 * @param config - Configuration for both detection and sanitization
 * @returns Array of middleware functions
 */
export function createNoSQLProtectionMiddleware(
  config: NoSQLProtectionConfig = {}
): RequestHandler[] {
  const { sanitization = {}, detection = {}, detectFirst = true } = config;

  const detectionMiddleware = createNoSQLDetectionMiddleware(detection);
  const sanitizationMiddleware = createNoSQLSanitizationMiddleware(sanitization);

  // Detection first (recommended) - blocks requests before sanitization
  if (detectFirst) {
    return [detectionMiddleware, sanitizationMiddleware];
  }
  
  // Sanitization first - cleans data then detects remaining threats
  return [sanitizationMiddleware, detectionMiddleware];
}

/**
 * Pre-configured combined middleware with default settings
 * Provides comprehensive NoSQL injection protection
 */
export const noSQLProtectionMiddleware = createNoSQLProtectionMiddleware();

// ===== COMPREHENSIVE SECURITY STACK =====

/**
 * Configuration for the complete security stack
 */
export interface SecurityStackConfig {
  cors?: CORSConfig;
  ddos?: DDOSProtectionConfig;
  bot?: BotProtectionConfig;
  rateLimit?: RateLimitConfig;
  noSQL?: NoSQLProtectionConfig;
  xss?: XSSProtectionConfig;
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
    ddos = {},
    bot = {},
    rateLimit = {},
    noSQL = {},
    xss = {},
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
      case 'ddos':
        middlewareStack.push(createDDOSProtectionMiddleware(ddos));
        break;
      case 'bot':
        middlewareStack.push(createBotProtectionMiddleware(bot));
        break;
      case 'rateLimit':
        middlewareStack.push(createRateLimitMiddleware(rateLimit));
        break;
      case 'noSQL':
        middlewareStack.push(...createNoSQLProtectionMiddleware(noSQL));
        break;
      case 'xss':
        middlewareStack.push(createXSSProtection(xss));
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
  ddos: ddosProtectionMiddleware,
  bot: botProtectionMiddleware,
  rateLimit: rateLimitMiddleware,
  noSQL: noSQLProtectionMiddleware,
  xss: xssProtection,
} as const;