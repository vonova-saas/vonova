import { getEnv } from "../utils/get-env";

const envConfig = () => ({
  //? Backend Configuration
  PORT: getEnv("PORT"),
  NODE_ENV: getEnv("NODE_ENV"),
  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN"),

  //? Swagger Docs Configuration
  SWAGGER_USER: getEnv("SWAGGER_USER"),
  SWAGGER_PASSWORD: getEnv("SWAGGER_PASSWORD"),

  //* Database configuration (MongoDB),
  MONGO_URI_RMOTE: getEnv("MONGO_URI_RMOTE"),
  // MONGO_URI_LOCAL: getEnv("MONGO_URI_LOCAL"),

  //! Security Layer
  // CORS Protection
  CORS_ORIGIN: getEnv("CORS_ORIGIN", "http://localhost:3000"),
  CORS_METHODS: getEnv("CORS_METHODS", "GET,POST,PUT,DELETE,OPTIONS"),
  CORS_ALLOWED_HEADERS: getEnv("CORS_ALLOWED_HEADERS", "Content-Type,Authorization,X-Requested-With"),
  CORS_EXPOSED_HEADERS: getEnv("CORS_EXPOSED_HEADERS", ""),
  CORS_CREDENTIALS: getEnv("CORS_CREDENTIALS", "true"),
  CORS_MAX_AGE: getEnv("CORS_MAX_AGE", "86400"),
  CORS_WHITELIST: getEnv("CORS_WHITELIST"),
  CORS_BLACKLIST: getEnv("CORS_BLACKLIST"),
  CORS_SECURITY_HEADERS: getEnv("CORS_SECURITY_HEADERS", "true"),

  // Signed Auth Context from API Gateway
  API_GATEWAY_SERVICE_URL: getEnv("API_GATEWAY_SERVICE_URL"),
  APP_SIGNING_SECRET: getEnv("APP_SIGNING_SECRET"),
  TRUST_SIGNED_CONTEXT: getEnv("TRUST_SIGNED_CONTEXT"),
  SIGNED_CONTEXT_SKEW_SECONDS: parseInt(getEnv("SIGNED_CONTEXT_SKEW_SECONDS")),
  INTERNAL_API_SECRET_KEY: getEnv("INTERNAL_API_SECRET_KEY"),

  //? Notification Service (Email configuration)
  EMAIL_HOST: getEnv("EMAIL_HOST"),
  EMAIL_PORT: parseInt(getEnv("EMAIL_PORT") || "465"),
  EMAIL_SECURE: getEnv("EMAIL_SECURE", "true") === "true",
  EMAIL_PASSWORD: getEnv("EMAIL_PASSWORD"),
  EMAIL_USER: getEnv("EMAIL_USER"),
  EMAIL_FROM: getEnv("EMAIL_FROM"),
});

export const Env = envConfig();