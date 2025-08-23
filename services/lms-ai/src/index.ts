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
// TODO: Add other AI features when implemented
// import pdfSummaryRoutes from "./ai-pdf-summary/routes/pdf-summary.route";
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
              service: "Vonova LMS AI Roadmap Generation",
              version: "1.0.0",
              description: "AI-powered learning roadmap generation and management system",
      timestamp: new Date().toISOString(),
      ports: {
        backend: parseInt(Env.PORT),
        ai_service: 5000,
        frontend: 3000
      },
      features: {
        "AI Roadmap Generator": {
          status: "Active",
          description: "Generate personalized learning roadmaps using AI",
          endpoints: [
            "POST /api/roadmap/generate",
            "GET /api/roadmap/:roadmapId", 
            "PUT /api/roadmap/:roadmapId/progress",
            "GET /api/roadmap/user/:userId"
          ]
        },
        "AI PDF Summary": {
          status: "Coming Soon",
          description: "Intelligent PDF document summarization",
          endpoints: ["POST /api/pdf-summary/generate"]
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
        ai_connection: `${Env.BASE_PATH}/roadmap/test-ai-connection`,
        system_status: `${Env.BASE_PATH}/roadmap/system-status`,
        analytics: `${Env.BASE_PATH}/roadmap/popular-topics`
      },
      documentation: {
        swagger_ui: "/api-docs",
        interactive_api: "/api-docs",
        authentication: "Basic Auth (admin/vonova2024)"
      },
      communication: {
        ai_service_url: Env.ROADMAP_AI_SERVICE_URL,
        status: "Backend ↔ AI Service communication configured",
        protocol: "HTTP REST API"
      }
    });
  })
);

// API ROUTES

app.use(`${Env.BASE_PATH}/roadmap`, roadmapRoutes);

if (Env.NODE_ENV !== 'development') {
  app.use(`/api-docs`, swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  app.use(`/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(errorHandler);

// ============ SERVER STARTUP ============
app.listen(Env.PORT, async () => {
          console.log('');
        console.log('VONOVA LMS AI ROADMAP GENERATION - STARTING UP');
        console.log('');
  console.log(`Backend Service: http://localhost:${Env.PORT}`);
  console.log(`AI Service: ${Env.ROADMAP_AI_SERVICE_URL}`);
  console.log(`API Documentation: http://localhost:${Env.PORT}/api-docs`);
  console.log(`Health Check: http://localhost:${Env.PORT}${Env.BASE_PATH}/roadmap/health`);
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
          console.log('LMS AI ROADMAP GENERATION SERVICE IS READY!');
          console.log('');
});