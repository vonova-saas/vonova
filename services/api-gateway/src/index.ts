import "dotenv/config";
import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response } from "express";
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { config } from './config/gateway.config';
import { createGatewayRouter } from './routes/gateway.routes';
import {
  healthCheckMiddleware,
} from './middlewares/healthCheck.middleware';
import { applySecurityStack, securityStack } from "./middlewares/security";
import { HTTPSTATUS } from './config/http.config';
import { errorHandler } from './middlewares/errors/errorHandler.middleware';
import { asyncHandler } from './middlewares/api/asyncHandler.middleware';
import { Env } from "./config/env.config";
import { swaggerUi, swaggerSpec } from "./services/docs/swagger.service";
import { swaggerAuth } from "./middlewares/docs/swagger-docs.middleware";
import connectDatabase from "./config/database.config";
import "./config/passport.config";
import passport from "passport";
import * as path from 'path';
import * as fs from 'fs';
import { allowDenyMiddleware } from "./middlewares/api/allow-deny.middleware";

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Process multipart/form-data and prepare files for forwarding
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    // Process files and add them to req.body for the proxy service
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        if (!req.body[file.fieldname]) {
          req.body[file.fieldname] = {
            file: true,
            path: file.path,
            name: file.originalname,
            type: file.mimetype,
            size: file.size
          };
        }
      });
    }
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Initialize passport
app.use(passport.initialize());

// Handle file uploads
app.use(upload.any());

// Security Layers
applySecurityStack(app, {
  cors: {},
  ddos: {},
  bot: {},
  rateLimit: {},
  noSQL: {},
  xss: {},
});

app.use(helmet());

// Health check
app.use(healthCheckMiddleware);

// Use gateway routes
app.use(createGatewayRouter());

// Global error handler
app.use(errorHandler);

// Honor X-Forwarded-* headers for proper client IP/origin handling behind proxies
//ToDo: make this after use Vercel’s Outbound IPs
// app.set('trust proxy', true);

// Early allow/deny guard (pre CORS/body parsing ideal for cheap rejections)
app.use(allowDenyMiddleware());

// Logging
if (Env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Welcome route
app.get(
  `/`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    return res.status(HTTPSTATUS.OK).json({
      message: 'API Gateway is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: Object.keys(config.services)
    });
  })
);

// 404 handler for undefined routes
app.use(
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(HTTPSTATUS.NOT_FOUND).json({
      error: 'Not Found',
      message: 'The requested endpoint was not found',
    });
  })
);

// Swagger API Endpoints Docs
if (Env.NODE_ENV !== 'development') {
  app.use(`/api-docs`, swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  app.use(`/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Start the gateway
app.listen(Env.PORT, async () => {
  console.log('🚀 API Gateway started successfully');
  console.log(`📍 Server running on port ${Env.PORT}`);
  console.log(`🌍 Environment: ${Env.NODE_ENV}`);
  console.log('📊 Registered services:');
  Object.values(config.services).forEach(service => {
    console.log(`   - ${service.name}: ${service.url}`);
  });
  console.log(`🔒 Security stack enabled with ${securityStack.length} protection layers`);
  await connectDatabase();
});


// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});