import { registerAs } from '@nestjs/config';

export const envConfig = registerAs('env', () => ({
  port: parseInt(process.env.PORT, 10) || 4005,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongoUriRoadmapAi: process.env.MONGO_URI_ROADMAP_AI || 'mongodb://localhost:27017/ROADMAP_AI',

  // AI Services
  roadmapAiServiceUrl: process.env.ROADMAP_AI_SERVICE_URL || 'http://localhost:5000',
  pdfSummaryAiServiceUrl: process.env.PDF_SUMMARY_AI_SERVICE_URL || 'http://localhost:5001',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',

  // Swagger
  swaggerUser: process.env.SWAGGER_USER || 'admin',
  swaggerPassword: process.env.SWAGGER_PASSWORD || 'vonova2024',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  enableConsoleLogging: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
  enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
  maxLogFileSize: process.env.MAX_LOG_FILE_SIZE || '50m',
  maxLogFiles: process.env.MAX_LOG_FILES || '30d',
}));
