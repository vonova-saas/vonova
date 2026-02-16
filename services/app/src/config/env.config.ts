import { registerAs } from '@nestjs/config';

export const envConfig = registerAs('env', () => ({
  // Backend Configuration
  port: parseInt(process.env.PORT || '4001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN,

  // Swagger Docs Configuration
  swaggerUser: process.env.SWAGGER_USER,
  swaggerPassword: process.env.SWAGGER_PASSWORD,

  // Database configuration (MongoDB)
  mongoUriRemote: process.env.MONGO_URI_RMOTE,

  // Authentication Layer
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },

  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
  frontendGoogleCallbackUrl: process.env.FRONTEND_GOOGLE_CALLBACK_URL,

  // Email configuration (NodeMailer SMTP)
  emailHost: process.env.EMAIL_HOST,
  emailPort: parseInt(process.env.EMAIL_PORT || '465', 10),
  emailSecure: process.env.EMAIL_SECURE !== 'false',
  emailPassword: process.env.EMAIL_PASSWORD,
  emailUser: process.env.EMAIL_USER,
  emailFrom: process.env.EMAIL_FROM,
  // Resend (Email Service)
  resendApiKey: process.env.RESEND_API_KEY,

  // Service URLs
  appServiceUrl: process.env.APP_SERVICE_URL,
  lmsServiceUrl: process.env.LMS_SERVICE_URL,
  lmsAiServiceUrl: process.env.LMS_AI_SERVICE_URL,
  // Internal inter-service communication
  internalApiSecretKey: process.env.INTERNAL_API_SECRET_KEY,
  gatewaySigningSecret: process.env.GATEWAY_SIGNING_SECRET,

  // Security Layer - Rate limiting
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  globalRateLimitWindowMs: process.env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  globalRateLimitMaxRequests: process.env.GLOBAL_RATE_LIMIT_MAX_REQUESTS,
  strictRateLimitWindowMs: process.env.STRICT_RATE_LIMIT_WINDOW_MS,
  strictRateLimitMaxRequests: process.env.STRICT_RATE_LIMIT_MAX_REQUESTS,
  trustedIps: process.env.TRUSTED_IPS,

  // DDoS Protection
  ddosLimit: process.env.DDOS_LIMIT,
  ddosBurst: process.env.DDOS_BURST,
  ddosWindowMs: process.env.DDOS_WINDOW_MS,
  ddosBlacklist: process.env.DDOS_BLACKLIST,
  ddosWhitelist: process.env.DDOS_WHITELIST,
  ddosAutoBanCount: process.env.DDOS_AUTO_BAN_COUNT,
  ddosAutoBanTime: process.env.DDOS_AUTO_BAN_TIME,

  // CORS Protection
  corsOrigin: process.env.CORS_ORIGIN,
  corsMethods: process.env.CORS_METHODS,
  corsAllowedHeaders: process.env.CORS_ALLOWED_HEADERS,
  corsExposedHeaders: process.env.CORS_EXPOSED_HEADERS,
  corsCredentials: process.env.CORS_CREDENTIALS,
  corsMaxAge: process.env.CORS_MAX_AGE,
  corsWhitelist: process.env.CORS_WHITELIST,
  corsBlacklist: process.env.CORS_BLACKLIST,
  corsSecurityHeaders: process.env.CORS_SECURITY_HEADERS,

  // Redis Configuration
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
}));

// Backward compatibility: Export Env object with getters for runtime access
export const Env = {
  get PORT() {
    return process.env.PORT || '4001';
  },
  get NODE_ENV() {
    return process.env.NODE_ENV;
  },
  get FRONTEND_ORIGIN() {
    return process.env.FRONTEND_ORIGIN;
  },
  get SWAGGER_USER() {
    return process.env.SWAGGER_USER;
  },
  get SWAGGER_PASSWORD() {
    return process.env.SWAGGER_PASSWORD;
  },
  get MONGO_URI_RMOTE() {
    return process.env.MONGO_URI_RMOTE;
  },
  JWT: {
    get JWT_ACCESS_SECRET() {
      return process.env.JWT_ACCESS_SECRET;
    },
    get JWT_ACCESS_EXPIRES_IN() {
      return process.env.JWT_ACCESS_EXPIRES_IN;
    },
    get JWT_REFRESH_SECRET() {
      return process.env.JWT_REFRESH_SECRET;
    },
    get JWT_REFRESH_EXPIRES_IN() {
      return process.env.JWT_REFRESH_EXPIRES_IN;
    },
  },
  get GOOGLE_CLIENT_ID() {
    return process.env.GOOGLE_CLIENT_ID;
  },
  get GOOGLE_CLIENT_SECRET() {
    return process.env.GOOGLE_CLIENT_SECRET;
  },
  get GOOGLE_CALLBACK_URL() {
    return process.env.GOOGLE_CALLBACK_URL;
  },
  get FRONTEND_GOOGLE_CALLBACK_URL() {
    return process.env.FRONTEND_GOOGLE_CALLBACK_URL;
  },
  get EMAIL_HOST() {
    return process.env.EMAIL_HOST;
  },
  get EMAIL_PORT() {
    return parseInt(process.env.EMAIL_PORT || '465', 10);
  },
  get EMAIL_SECURE() {
    return process.env.EMAIL_SECURE !== 'false';
  },
  get EMAIL_PASSWORD() {
    return process.env.EMAIL_PASSWORD;
  },
  get EMAIL_USER() {
    return process.env.EMAIL_USER;
  },
  get EMAIL_FROM() {
    return process.env.EMAIL_FROM;
  },
  get RESEND_API_KEY() {
    return process.env.RESEND_API_KEY;
  },
  get APP_SERVICE_URL() {
    return process.env.APP_SERVICE_URL;
  },
  get LMS_SERVICE_URL() {
    return process.env.LMS_SERVICE_URL;
  },
  get LMS_AI_SERVICE_URL() {
    return process.env.LMS_AI_SERVICE_URL;
  },
  get INTERNAL_API_SECRET_KEY() {
    return process.env.INTERNAL_API_SECRET_KEY;
  },
  get GATEWAY_SIGNING_SECRET() {
    return process.env.GATEWAY_SIGNING_SECRET;
  },
  get CORS_ORIGIN() {
    return process.env.CORS_ORIGIN;
  },
  get CORS_METHODS() {
    return process.env.CORS_METHODS;
  },
  get CORS_ALLOWED_HEADERS() {
    return process.env.CORS_ALLOWED_HEADERS;
  },
  get CORS_CREDENTIALS() {
    return process.env.CORS_CREDENTIALS;
  },
};
