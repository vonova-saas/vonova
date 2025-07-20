import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errors/errorHandler.middleware";
import { Env } from "./config/env.config";
import connectDatabase from "./config/database.config";
import "./config/passport.config";
import passport from "passport";
import { swaggerUi, swaggerSpec } from "./services/swagger.service";
import { swaggerAuth } from "./middlewares/docs/swagger-docs.middleware";
import authRoutes from "./routes/auth.route";
import { applySecurityStack, securityStack } from "./middlewares/security";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

applySecurityStack(app, {
  cors: {},
  bot: {},
});

app.get(
  `/health`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    return res.status(HTTPSTATUS.OK).json({
      status: "Healthy!",
      service: "Auth Service",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  })
);

if (Env.NODE_ENV !== 'development') {
  app.use(`/api-docs`, swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  app.use(`/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(`/auth`, authRoutes);

app.use(errorHandler);

app.listen(Env.PORT, async () => {
  console.log(`🚀 User Service listening on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
  console.log(`📚 Swagger docs available at http://localhost:${Env.PORT}/api-docs`);
  console.log(`🔒 Security stack enabled with ${securityStack.length} protection layers`);
  await connectDatabase();
});