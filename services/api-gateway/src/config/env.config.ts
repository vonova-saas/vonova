import { getEnv } from "../utils/get-env";

const envConfig = () => ({
  //? =========== Backend Configuration ===========
  PORT: getEnv("PORT", "4004"),
  NODE_ENV: getEnv("NODE_ENV", "development"),
  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:3000"),

  // Swagger Docs Configuration
  SWAGGER_USER: getEnv("SWAGGER_USER", ""),
  SWAGGER_PASSWORD: getEnv("SWAGGER_PASSWORD", ""),

  //* Database configuration (MongoDB),
  MONGO_URI_REMOTE: getEnv("MONGO_URI_REMOTE", "mongodb://localhost:27017/vonova"),
  // MONGO_URI_LOCAL: getEnv("MONGO_URI_LOCAL"),

  //! =========== Authentication Layer ===========
  JWT: {
    JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
    JWT_ACCESS_EXPIRES_IN: getEnv("JWT_ACCESS_EXPIRES_IN"),
    JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
    JWT_REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN"),
  },

  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: getEnv("GOOGLE_CALLBACK_URL"),
  FRONTEND_GOOGLE_CALLBACK_URL: getEnv("FRONTEND_GOOGLE_CALLBACK_URL"),

  //? Email configuration (NodeMailer STMP)
  EMAIL_HOST: getEnv("EMAIL_HOST"),
  EMAIL_PORT: parseInt(getEnv("EMAIL_PORT") || "465"),
  EMAIL_SECURE: getEnv("EMAIL_SECURE", "true") === "true",
  EMAIL_PASSWORD: getEnv("EMAIL_PASSWORD"),
  EMAIL_USER: getEnv("EMAIL_USER"),
  EMAIL_FROM: getEnv("EMAIL_FROM"),
  //* Resend (Email Service)
  RESEND_API_KEY: getEnv("RESEND_API_KEY"),

  //! =========== Service URLs ===========
  APP_SERVICE_URL: getEnv("APP_SERVICE_URL"),
  LMS_SERVICE_URL: getEnv("LMS_SERVICE_URL"),
  LMS_AI_SERVICE_URL: getEnv("LMS_AI_SERVICE_URL"),
  ROADMAP_AI_SERVICE_URL: getEnv("ROADMAP_AI_SERVICE_URL", "http://127.0.0.1:5000"),
  PDF_SUMMARY_AI_SERVICE_URL: getEnv("PDF_SUMMARY_AI_SERVICE_URL", "http://127.0.0.1:5015"),
  // Internal inter-service communication
  // Shared secret used by API Gateway to authenticate internal-only endpoints
  INTERNAL_API_SECRET_KEY: getEnv("INTERNAL_API_SECRET_KEY"),
  // Secret used by API Gateway to sign auth context headers for downstream services
  GATEWAY_SIGNING_SECRET: getEnv("GATEWAY_SIGNING_SECRET"),

  //! =========== Security Layer===========
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: getEnv("RATE_LIMIT_WINDOW_MS"),
  RATE_LIMIT_MAX_REQUESTS: getEnv("RATE_LIMIT_MAX_REQUESTS"),
  GLOBAL_RATE_LIMIT_WINDOW_MS: getEnv("GLOBAL_RATE_LIMIT_WINDOW_MS"),
  GLOBAL_RATE_LIMIT_MAX_REQUESTS: getEnv("GLOBAL_RATE_LIMIT_MAX_REQUESTS"),
  STRICT_RATE_LIMIT_WINDOW_MS: getEnv("STRICT_RATE_LIMIT_WINDOW_MS"),
  STRICT_RATE_LIMIT_MAX_REQUESTS: getEnv("STRICT_RATE_LIMIT_MAX_REQUESTS"),
  TRUSTED_IPS: getEnv("TRUSTED_IPS"),

  // DDoS Protection
  DDOS_LIMIT: getEnv("DDOS_LIMIT"),
  DDOS_BURST: getEnv("DDOS_BURST"),
  DDOS_WINDOW_MS: getEnv("DDOS_WINDOW_MS"),
  DDOS_BLACKLIST: getEnv("DDOS_BLACKLIST"),
  DDOS_WHITELIST: getEnv("DDOS_WHITELIST"),
  DDOS_AUTO_BAN_COUNT: getEnv("DDOS_AUTO_BAN_COUNT"),
  DDOS_AUTO_BAN_TIME: getEnv("DDOS_AUTO_BAN_TIME"),

  // CORS Protection
  CORS_ORIGIN: getEnv("CORS_ORIGIN", "http://localhost:3000"),
  CORS_METHODS: getEnv("CORS_METHODS", "GET,POST,PUT,DELETE,OPTIONS"),
  CORS_ALLOWED_HEADERS: getEnv("CORS_ALLOWED_HEADERS", "Content-Type,Authorization,X-Requested-With"),
  CORS_EXPOSED_HEADERS: getEnv("CORS_EXPOSED_HEADERS", ""),
  CORS_CREDENTIALS: getEnv("CORS_CREDENTIALS", "true"),
  CORS_MAX_AGE: getEnv("CORS_MAX_AGE", "86400"),
  CORS_WHITELIST: getEnv("CORS_WHITELIST", "http://localhost:3000"),
  CORS_BLACKLIST: getEnv("CORS_BLACKLIST", ""),
  CORS_SECURITY_HEADERS: getEnv("CORS_SECURITY_HEADERS", "true"),

  // ============ Anothers Configuration ============
  UPSTASH_REDIS_REST_URL: getEnv("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN: getEnv("UPSTASH_REDIS_REST_TOKEN"),

  //! =========== NATS Messaging =============
  NATS_URL: getEnv("NATS_URL", "nats://localhost:4222"),
  NATS_USER: getEnv("NATS_USER"),
  NATS_PASSWORD: getEnv("NATS_PASSWORD"),
  NATS_PREFIX: getEnv("NATS_PREFIX", "vonova"),
});

export const Env = envConfig();