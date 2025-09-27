import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errors/errorHandler.middleware";
import { Env } from "./config/env.config";
import connectDatabase from "./config/database.config";
//import { swaggerUi, swaggerSpec } from "./services/swagger.service";
import { swaggerAuth } from "./middlewares/docs/swagger-docs.middleware";
import { applySecurityStack, securityStack } from "./middlewares/security";
import { swaggerSpec, swaggerUi } from "./services/docs/swagger.service";
import quizRouter from "./routes/quizzes/quiz.routes";
import assignmentRouter from "./routes/assignment/assignment.routes";
import libraryRouter from "./routes/library/library.routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

applySecurityStack(app, {
  cors: {},
  bot: {},
});

app.get(
  `/lms/health`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    return res.status(HTTPSTATUS.OK).json({
      status: "Healthy!",
      service: "LMS Service",
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

app.use("/lms/quizzes", quizRouter);
app.use("/lms/assignments", assignmentRouter);
app.use("/lms/library", libraryRouter);

app.use(errorHandler);


app.listen(Env.PORT, async () => {
  console.log(`🚀 LMS Service listening on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
  console.log(`📚 Swagger docs available at http://localhost:${Env.PORT}/api-docs`);
  console.log(`🔒 Security stack enabled with ${securityStack.length} protection layers`);
  await connectDatabase();
});
