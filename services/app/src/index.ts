import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errors/errorHandler.middleware";
import { Env } from "./config/env.config";
import connectDatabase from "./config/database.config";
import { swaggerUi, swaggerSpec } from "./services/app/swagger.service";
import { swaggerAuth } from "./middlewares/docs/swagger-docs.middleware";
import { applySecurityStack, securityStack } from "./middlewares/security";
import cookieParser from "cookie-parser";
import userSettingsRoutes from "./routes/settings/settings.route";
import userAccountRoutes from "./routes/settings/account.route";
import userBillingRoutes from "./routes/settings/billing.route";
import userNotificationRoutes from "./routes/settings/notification.route";
import userSupportRoutes from "./routes/support/support.route";
import userFeedbackRoutes from "./routes/support/feedback.route";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

applySecurityStack(app, {
  cors: {},
  bot: {},
});

app.get(
  `/app/health`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    return res.status(HTTPSTATUS.OK).json({
      status: "Healthy!",
      service: "APP Service",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  })
);

if (Env.NODE_ENV !== 'development') {
  app.use(`/app/api-docs`, swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  app.use(`/app/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(`/app/settings`, userSettingsRoutes);
app.use(`/app/account`, userAccountRoutes);
app.use(`/app/billing`, userBillingRoutes);
app.use(`/app/notification`, userNotificationRoutes);
app.use(`/app/support`, userSupportRoutes);
app.use(`/app/feedback`, userFeedbackRoutes);

app.use(errorHandler);

app.listen(Env.PORT, async () => {
  console.log(`🚀 App Service listening on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
  console.log(`📚 Swagger docs available at http://localhost:${Env.PORT}/api-docs`);
  console.log(`🔒 Security stack enabled with ${securityStack.length} protection layers`);
  await connectDatabase();
});