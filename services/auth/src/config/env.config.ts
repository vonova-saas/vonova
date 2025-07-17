import { getEnv } from "../utils/get-env";

const envConfig = () => ({
  //? Backend Configuration
  PORT: getEnv("PORT", "5000"),
  NODE_ENV: getEnv("NODE_ENV", "development"),
  BASE_PATH: getEnv("BASE_PATH", "/api"),
  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:3000"),

  //? Swagger Docs Configuration
  SWAGGER_USER: getEnv("SWAGGER_USER", "staffly"),
  SWAGGER_PASSWORD: getEnv("SWAGGER_PASSWORD", "defaultPass"),

  //* Database configuration (MongoDB),
  MONGO_URI_RMOTE: getEnv("MONGO_URI_RMOTE"),
  // MONGO_URI_LOCAL: getEnv("MONGO_URI_LOCAL"),

  // Authentication Layer
  JWT: {
    JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET", "jwt_secret"),
    JWT_ACCESS_EXPIRES_IN: getEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
    JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET", "jwt_refresh_key"),
    JWT_REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
  },

  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: getEnv("GOOGLE_CALLBACK_URL"),
  FRONTEND_GOOGLE_CALLBACK_URL: getEnv("FRONTEND_GOOGLE_CALLBACK_URL"),

  GITHUB_CLIENT_ID: getEnv("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: getEnv("GITHUB_CLIENT_SECRET"),
  GITHUB_CALLBACK_URL: getEnv("GITHUB_CALLBACK_URL"),
  FRONTEND_GITHUB_CALLBACK_URL: getEnv("FRONTEND_GITHUB_CALLBACK_URL"),

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
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "465"),
  EMAIL_SECURE: process.env.EMAIL_SECURE === "true",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_USER: process.env.EMAIL_USER || "devoviacompany@gmail.com",
  EMAIL_FROM: process.env.EMAIL_FROM || "devoviacompany@gmail.com",

  // ============ Anothers Configuration ============
  UPSTASH_REDIS_REST_URL: getEnv("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN: getEnv("UPSTASH_REDIS_REST_TOKEN"),

});

export const Env = envConfig();