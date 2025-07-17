import basicAuth from 'express-basic-auth';
import { Env } from '../../config/env.config';

export const swaggerAuth = basicAuth({
  users: { [Env.SWAGGER_USER]: Env.SWAGGER_PASSWORD },
  challenge: true, // browser will prompt for login
  unauthorizedResponse: () => {
    return {
      message: "🚫 Unauthorized: Swagger access is restricted",
      timestamp: new Date().toISOString(),
    };
  }
});