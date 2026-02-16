import { Env } from './env.config';

export interface ServiceConfig {
  name: string;
  url: string;
  healthCheck: string;
  timeout: number;
}

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  service: string;
  target: string;
  auth?: boolean;
  rateLimit?: number;
  stripServicePrefix?: boolean; // If true, don't add service name to target path
}

export const config = {
  // Services configuration
  services: {
    app: {
      name: 'app',
      url: Env.APP_SERVICE_URL,
      healthCheck: '/api/v1', // App service has global prefix 'api/v1' and health at root
      timeout: 5000
    } as ServiceConfig,

    lms: {
      name: 'lms',
      url: Env.LMS_SERVICE_URL,
      healthCheck: '/lms', // LMS service has global prefix 'lms' and health at root
      timeout: 5000
    } as ServiceConfig,

    lms_ai: {
      name: 'lms_ai',
      url: Env.LMS_AI_SERVICE_URL,
      healthCheck: '/health',
      timeout: 10000 // AI services may take longer
    } as ServiceConfig,

    roadmap_ai: {
      name: 'roadmap_ai',
      url: Env.ROADMAP_AI_SERVICE_URL,
      healthCheck: '/roadmap/health',
      timeout: 10000 // AI services may take longer
    } as ServiceConfig,

    pdf_summary_ai: {
      name: 'pdf_summary_ai',
      url: Env.PDF_SUMMARY_AI_SERVICE_URL,
      healthCheck: '/pdf-summary/health',
      timeout: 10000 // AI services may take longer
    } as ServiceConfig,
  },

  // Route configuration
  routes: [
    // App Service Routes - /api/v1/app/*
    // Note: App service has global prefix 'api/v1', so we strip 'app' prefix
    {
      path: '/api/v1/app/*',
      method: 'GET',
      service: 'app',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    {
      path: '/api/v1/app/*',
      method: 'POST',
      service: 'app',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    {
      path: '/api/v1/app/*',
      method: 'PUT',
      service: 'app',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    {
      path: '/api/v1/app/*',
      method: 'PATCH',
      service: 'app',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    {
      path: '/api/v1/app/*',
      method: 'DELETE',
      service: 'app',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    // LMS Service Routes - /api/v1/lms/*
    // Note: LMS service has global prefix 'lms', so we strip 'lms' prefix
    {
      path: '/api/v1/lms/*',
      method: 'GET',
      service: 'lms',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    {
      path: '/api/v1/lms/*',
      method: 'POST',
      service: 'lms',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    {
      path: '/api/v1/lms/*',
      method: 'PUT',
      service: 'lms',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    {
      path: '/api/v1/lms/*',
      method: 'PATCH',
      service: 'lms',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    {
      path: '/api/v1/lms/*',
      method: 'DELETE',
      service: 'lms',
      target: '/*',
      auth: true,
      stripServicePrefix: true,
    },
    // Roadmap AI Service Routes - /roadmap/*
    {
      path: '/roadmap/*',
      method: 'GET',
      service: 'roadmap_ai',
      target: '/*',
      auth: true,
    },
    {
      path: '/roadmap/*',
      method: 'POST',
      service: 'roadmap_ai',
      target: '/*',
      auth: true,
    },
    {
      path: '/roadmap/*',
      method: 'PUT',
      service: 'roadmap_ai',
      target: '/*',
      auth: true,
    },
    {
      path: '/roadmap/*',
      method: 'PATCH',
      service: 'roadmap_ai',
      target: '/*',
      auth: true,
    },
    {
      path: '/roadmap/*',
      method: 'DELETE',
      service: 'roadmap_ai',
      target: '/*',
      auth: true,
    },
    // PDF Summary AI Service Routes - /pdf-summary/*
    {
      path: '/pdf-summary/*',
      method: 'GET',
      service: 'pdf_summary_ai',
      target: '/*',
      auth: true,
    },
    {
      path: '/pdf-summary/*',
      method: 'POST',
      service: 'pdf_summary_ai',
      target: '/*',
      auth: true,
    },
    {
      path: '/pdf-summary/*',
      method: 'PUT',
      service: 'pdf_summary_ai',
      target: '/*',
      auth: true,
    },
    {
      path: '/pdf-summary/*',
      method: 'PATCH',
      service: 'pdf_summary_ai',
      target: '/*',
      auth: true,
    },
    {
      path: '/pdf-summary/*',
      method: 'DELETE',
      service: 'pdf_summary_ai',
      target: '/*',
      auth: true,
    },
    // Health endpoints (no auth required)
    {
      path: '/roadmap/health',
      method: 'GET',
      service: 'roadmap_ai',
      target: '/roadmap/health',
      auth: false,
    },
    {
      path: '/pdf-summary/health',
      method: 'GET',
      service: 'pdf_summary_ai',
      target: '/pdf-summary/health',
      auth: false,
    },
    {
      path: '/health',
      method: 'GET',
      service: 'lms_ai',
      target: '/health',
      auth: false,
    },
    // LMS-AI root endpoint
    {
      path: '/',
      method: 'GET',
      service: 'lms_ai',
      target: '/',
      auth: false,
    },
  ] as RouteConfig[],

  // Gateway settings
  gateway: {
    timeout: 10000,
    retries: 3,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100 // requests per window
  },
};