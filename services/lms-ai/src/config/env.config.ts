import { registerAs } from '@nestjs/config';

export const envConfig = registerAs('env', () => ({
  port: parseInt(process.env.PORT, 10) || 4005,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongoUriRoadmapAi: process.env.MONGO_URI_ROADMAP_AI || 'mongodb+srv://vonovacompany:SsaTK2cOSSWJi0DQ@auth.6dsl9nu.mongodb.net/LMS_AI?retryWrites=true&w=majority',
  mongoUriPdfSummaryAi: process.env.MONGO_URI_PDF_SUMMARY_AI || 'mongodb+srv://vonovacompany:SsaTK2cOSSWJi0DQ@auth.6dsl9nu.mongodb.net/LMS_AI?retryWrites=true&w=majority',

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

  // AWS S3 Configuration
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'eu-north-1',
  awsS3Bucket: process.env.AWS_S3_BUCKET,
}));
