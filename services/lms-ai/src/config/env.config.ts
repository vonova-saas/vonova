import { getEnv } from "../utils/get-env";

const envConfig = () => ({
  //? Backend Configuration
  PORT: getEnv("PORT", "4005"),
  NODE_ENV: getEnv("NODE_ENV", "development"),
  BASE_PATH: getEnv("BASE_PATH", "/api"),
  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:3000"),

  //? AI Service Configuration
  ROADMAP_AI_SERVICE_URL: getEnv("ROADMAP_AI_SERVICE_URL", "http://127.0.0.1:5000"),
  PD_SUMMARY_AI_SERVICE_URL: getEnv("PD_SUMMARY_AI_SERVICE_URL", "http://127.0.0.1:5001"),
  PROBLEM_SOLVER_AI_SERVICE_URL: getEnv("PROBLEM_SOLVER_AI_SERVICE_URL", "http://127.0.0.1:5002"),
  ASSISTANT_AI_SERVICE_URL: getEnv("ASSISTANT_AI_SERVICE_URL", "http://127.0.0.1:5003"),
  VIDEO_GEN_AI_SERVICE_URL: getEnv("VIDEO_GEN_AI_SERVICE_URL", "http://127.0.0.1:5004"),

  //? Swagger Docs Configuration
  SWAGGER_USER: getEnv("SWAGGER_USER", "vonova"),
  SWAGGER_PASSWORD: getEnv("SWAGGER_PASSWORD", "defaultPass"),

  //* Database configuration (MongoDB),
  MONGO_URI_RMOTE: getEnv("MONGO_URI_RMOTE", "mongodb+srv://vonovacompany:SsaTK2cOSSWJi0DQ@auth.6dsl9nu.mongodb.net/vonova_lms_ai"),
  // MONGO_URI_LOCAL: getEnv("MONGO_URI_LOCAL"),

  //! Security Layer
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: getEnv("RATE_LIMIT_WINDOW_MS", "900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: getEnv("RATE_LIMIT_MAX_REQUESTS", "100"),
  GLOBAL_RATE_LIMIT_WINDOW_MS: getEnv("GLOBAL_RATE_LIMIT_WINDOW_MS", "60000"), // 1 minute
  GLOBAL_RATE_LIMIT_MAX_REQUESTS: getEnv("GLOBAL_RATE_LIMIT_MAX_REQUESTS", "1000"),
  STRICT_RATE_LIMIT_WINDOW_MS: getEnv("STRICT_RATE_LIMIT_WINDOW_MS", "300000"), // 5 minutes
  STRICT_RATE_LIMIT_MAX_REQUESTS: getEnv("STRICT_RATE_LIMIT_MAX_REQUESTS", "50"),
  TRUSTED_IPS: getEnv("TRUSTED_IPS", "127.0.0.1,::1"),

  // DDoS Protection
  DDOS_LIMIT: getEnv("DDOS_LIMIT", "100"),
  DDOS_BURST: getEnv("DDOS_BURST", "20"),
  DDOS_WINDOW_MS: getEnv("DDOS_WINDOW_MS", "60000"), // 1 minute
  DDOS_BLACKLIST: getEnv("DDOS_BLACKLIST", "none"),
  DDOS_WHITELIST: getEnv("DDOS_WHITELIST", "127.0.0.1,::1"),
  DDOS_AUTO_BAN_COUNT: getEnv("DDOS_AUTO_BAN_COUNT", "5"),
  DDOS_AUTO_BAN_TIME: getEnv("DDOS_AUTO_BAN_TIME", "300000"), // 5 minutes

  // CORS Protection
  CORS_ORIGIN: getEnv("CORS_ORIGIN", "http://localhost:3000"),
  CORS_METHODS: getEnv("CORS_METHODS", "GET,POST,PUT,DELETE,OPTIONS"),
  CORS_ALLOWED_HEADERS: getEnv("CORS_ALLOWED_HEADERS", "Content-Type,Authorization,X-Requested-With"),
  CORS_EXPOSED_HEADERS: getEnv("CORS_EXPOSED_HEADERS", "none"),
  CORS_CREDENTIALS: getEnv("CORS_CREDENTIALS", "true"),
  CORS_MAX_AGE: getEnv("CORS_MAX_AGE", "86400"),
  CORS_WHITELIST: getEnv("CORS_WHITELIST", "http://localhost:3000,https://vonova.tech"),
  CORS_BLACKLIST: getEnv("CORS_BLACKLIST", "none"),
  CORS_SECURITY_HEADERS: getEnv("CORS_SECURITY_HEADERS", "true"),

  //? Email configuration
  EMAIL_HOST: getEnv("EMAIL_HOST", "smtp.gmail.com"),
  EMAIL_PORT: parseInt(getEnv("EMAIL_PORT", "465")),
  EMAIL_SECURE: getEnv("EMAIL_SECURE", "true") === "true",
  EMAIL_PASSWORD: getEnv("EMAIL_PASSWORD", "jaxy whio zpia tjsz"),
  EMAIL_USER: getEnv("EMAIL_USER", "vonovacompany@gmail.com"),
  EMAIL_FROM: getEnv("EMAIL_FROM", "vonovacompany@gmail.com"),

  // ============ Anothers Configuration ============
  UPSTASH_REDIS_REST_URL: getEnv("UPSTASH_REDIS_REST_URL", "none"),
  UPSTASH_REDIS_REST_TOKEN: getEnv("UPSTASH_REDIS_REST_TOKEN", "none"),

  // ============ Logging Configuration ============
  // Log levels and output
  LOG_LEVEL: getEnv("LOG_LEVEL", "info"),
  ENABLE_CONSOLE_LOGGING: getEnv("ENABLE_CONSOLE_LOGGING", "true") === "true",
  ENABLE_FILE_LOGGING: getEnv("ENABLE_FILE_LOGGING", "true") === "true",
  
  // File logging settings
  LOG_DIRECTORY: getEnv("LOG_DIRECTORY", "logs"),
  MAX_LOG_FILE_SIZE: parseInt(getEnv("MAX_LOG_FILE_SIZE", "5242880")), // 5MB default
  MAX_LOG_FILES: parseInt(getEnv("MAX_LOG_FILES", "5")),
  
  // Performance logging
  ENABLE_PERFORMANCE_LOGGING: getEnv("ENABLE_PERFORMANCE_LOGGING", "true") === "true",
  PERFORMANCE_THRESHOLD: parseInt(getEnv("PERFORMANCE_THRESHOLD", "1000")), // 1 second
  
  // Security logging
  ENABLE_SECURITY_LOGGING: getEnv("ENABLE_SECURITY_LOGGING", "true") === "true",
  LOG_SENSITIVE_DATA: getEnv("LOG_SENSITIVE_DATA", "false") === "true",
  
  // AI service logging
  ENABLE_AI_SERVICE_LOGGING: getEnv("ENABLE_AI_SERVICE_LOGGING", "true") === "true",
  LOG_AI_REQUESTS: getEnv("LOG_AI_REQUESTS", "true") === "true",
  LOG_AI_RESPONSES: getEnv("LOG_AI_RESPONSES", "false") === "true",
  
  // Database logging
  ENABLE_DATABASE_LOGGING: getEnv("ENABLE_DATABASE_LOGGING", "true") === "true",
  LOG_DATABASE_QUERIES: getEnv("LOG_DATABASE_QUERIES", "false") === "true",
  LOG_QUERY_TIME: getEnv("LOG_QUERY_TIME", "true") === "true",
  
  // User tracking
  ENABLE_USER_TRACKING: getEnv("ENABLE_USER_TRACKING", "true") === "true",
  LOG_USER_ACTIONS: getEnv("LOG_USER_ACTIONS", "true") === "true",
  LOG_USER_PROGRESS: getEnv("LOG_USER_PROGRESS", "true") === "true",
  
  // Error logging
  ENABLE_ERROR_LOGGING: getEnv("ENABLE_ERROR_LOGGING", "true") === "true",
  LOG_ERROR_STACK: getEnv("LOG_ERROR_STACK", "true") === "true",
  LOG_ERROR_CONTEXT: getEnv("LOG_ERROR_CONTEXT", "true") === "true",
});

export const Env = envConfig();