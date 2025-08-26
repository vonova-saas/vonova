import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errors/errorHandler.middleware";
import { Env } from "./config/env.config";
import connectDatabase from "./config/database.config";
import { swaggerUi, swaggerSpec } from "./services/swagger.service";
import { swaggerAuth } from "./middlewares/docs/swagger-docs.middleware";

// ============ AI FEATURE ROUTES ============
import roadmapRoutes from "./ai-roadmap-generator/routes/roadmap.route";
import pdfSummaryRoutes from "./ai-pdf-summary/routes/pdfSummary.routes";
// TODO: Add other AI features when implemented
// import problemSolvingRoutes from "./ai-problem-solving/routes/problem-solving.route";
// import assistantRoutes from "./ai-assistant/routes/assistant.route";
// import videoGenRoutes from "./ai-video-gen/routes/video-gen.route";

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get(
  `/`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
                return res.status(HTTPSTATUS.OK).json({
              status: "Healthy!",
              service: "Vonova LMS AI - Complete AI Platform",
              version: "1.0.0",
              description: "AI-powered learning platform with roadmap generation, PDF summarization, and more",
      timestamp: new Date().toISOString(),
      ports: {
        backend: parseInt(Env.PORT),
        roadmap_ai_service: 5000,
        pdf_summary_ai_service: 5001,
        frontend: 3000
      },
      features: {
        "AI Roadmap Generator": {
          status: "Active",
          description: "Generate personalized learning roadmaps using AI",
          endpoints: [
            "POST /api/roadmap/generate",
            "GET /api/roadmap/:roadmapId", 
            "PUT /api/roadmap/:roadmapId/progress"
          ]
        },
        "AI PDF Summary": {
          status: "Active",
          description: "Intelligent PDF document summarization and chat",
          endpoints: [
            "POST /api/pdf-summary/generate",
            "POST /api/pdf-summary/upload",
            "POST /api/pdf-summary/chat",
            "GET /api/pdf-summary/summary/:summaryId",
            "GET /api/pdf-summary/session/:sessionId/chat-history"
          ]
        },
        "AI Problem Solving": {
          status: "Coming Soon", 
          description: "AI-powered problem solving assistance",
          endpoints: ["POST /api/problem-solving/solve"]
        },
        "AI Assistant": {
          status: "Coming Soon",
          description: "Intelligent learning assistant chatbot",
          endpoints: ["POST /api/assistant/chat"]
        },
        "AI Video Generator": {
          status: "Coming Soon",
          description: "Generate educational videos from content",
          endpoints: ["POST /api/video-gen/create"]
        }
      },
      monitoring: {
        health: `${Env.BASE_PATH}/roadmap/health`,
        roadmap_ai_connection: `${Env.BASE_PATH}/roadmap/test-ai-connection`,
        pdf_summary_health: `${Env.BASE_PATH}/pdf-summary/health`,
        system_status: `${Env.BASE_PATH}/roadmap/system-status`,
        analytics: undefined
      },
      documentation: {
        swagger_ui: "/api-docs",
        interactive_api: "/api-docs",
        authentication: "Basic Auth (admin/vonova2024)"
      },
      communication: {
        roadmap_ai_service_url: Env.ROADMAP_AI_SERVICE_URL,
        pdf_summary_ai_service_url: Env.PDF_SUMMARY_AI_SERVICE_URL,
        status: "Backend ↔ AI Services communication configured",
        protocol: "HTTP REST API"
      }
    });
  })
);

// API ROUTES

app.use(`${Env.BASE_PATH}/roadmap`, roadmapRoutes);
app.use(`${Env.BASE_PATH}/pdf-summary`, pdfSummaryRoutes);

if (Env.NODE_ENV !== 'development') {
  app.use(`/api-docs`, swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  app.use(`/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(errorHandler);

// ============ SERVER STARTUP ============
app.listen(Env.PORT, async () => {
          console.log('');
        console.log('VONOVA LMS AI PLATFORM - STARTING UP');
        console.log('');
  console.log(`Backend Service: http://localhost:${Env.PORT}`);
  console.log(`Roadmap AI Service: ${Env.ROADMAP_AI_SERVICE_URL}`);
  console.log(`PDF Summary AI Service: ${Env.PDF_SUMMARY_AI_SERVICE_URL}`);
  console.log(`API Documentation: http://localhost:${Env.PORT}/api-docs`);
  console.log(`Roadmap Health: http://localhost:${Env.PORT}${Env.BASE_PATH}/roadmap/health`);
  console.log(`PDF Summary Health: http://localhost:${Env.PORT}${Env.BASE_PATH}/pdf-summary/health`);
  console.log(`AI Connection Test: http://localhost:${Env.PORT}${Env.BASE_PATH}/roadmap/test-ai-connection`);
  console.log('');
  console.log(`Environment: ${Env.NODE_ENV}`);
  console.log(`Server listening on port ${Env.PORT}`);
  
  // Connect to database (optional for testing)
  try {
    await connectDatabase();
    console.log('Database connected successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.warn('Database connection failed (service will run with limited functionality):', errorMessage);
    console.log('To enable full functionality, configure MONGO_URI_ROADMAP_AI in your .env file');
  }
  
            console.log('');
          console.log('LMS AI PLATFORM IS READY!');
          console.log('');
          console.log('Available Services:');
          console.log('AI Roadmap Generator');
          console.log('AI PDF Summary & Chat');
          console.log('AI Problem Solving (Coming Soon)');
          console.log('AI Assistant (Coming Soon)');
          console.log('AI Video Generator (Coming Soon)');
          console.log('');
});