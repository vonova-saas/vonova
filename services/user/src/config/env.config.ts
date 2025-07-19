import { getEnv } from "../utils/get-env";

const envConfig = () => ({
  //? Backend Configuration
  PORT: getEnv("PORT"),
  NODE_ENV: getEnv("NODE_ENV"),
  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:3000"),

  //? Swagger Docs Configuration
  SWAGGER_USER: getEnv("SWAGGER_USER"),
  SWAGGER_PASSWORD: getEnv("SWAGGER_PASSWORD"),


  //* Database configuration (MongoDB),
  MONGO_URI_RMOTE: getEnv("MONGO_URI_RMOTE"),
  // MONGO_URI_LOCAL: getEnv("MONGO_URI_LOCAL"),

  //! Security Layer
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

  //? Email configuration
  EMAIL_HOST: getEnv("EMAIL_HOST"),
  EMAIL_PORT: parseInt(getEnv("EMAIL_PORT") || "465"),
  EMAIL_SECURE: getEnv("EMAIL_SECURE", "true") === "true",
  EMAIL_PASSWORD: getEnv("EMAIL_PASSWORD"),
  EMAIL_USER: getEnv("EMAIL_USER"),
  EMAIL_FROM: getEnv("EMAIL_FROM"),

  // ============ Anothers Configuration ============
  UPSTASH_REDIS_REST_URL: getEnv("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN: getEnv("UPSTASH_REDIS_REST_TOKEN"),

});

export const Env = envConfig();