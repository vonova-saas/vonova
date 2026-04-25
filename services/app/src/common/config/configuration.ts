export default () => ({
  //? =========== Backend Configuration ===========
  /** When true, {@link AdminSeederService} upserts predefined admin users on app startup. */
  SEED_ADMINS_ON_BOOT: process.env.SEED_ADMINS_ON_BOOT === 'true',
  NATS_URL: process.env.NATS_URL,
  NATS_USER: process.env.NATS_USER,
  NATS_PASSWORD: process.env.NATS_PASSWORD,
  NODE_ENV: process.env.NODE_ENV,

  //* Database configuration (MongoDB),
  MONGO_URI_REMOTE_APP: process.env.MONGO_URI_REMOTE_APP,
  MONGO_URI_LOCAL_APP: process.env.MONGO_URI_LOCAL_APP,
  MONGO_DB_NAME_APP: process.env.MONGO_DB_NAME_APP,

  //* Admin Database configuration (Separate MongoDB for Admin),
  MONGO_URI_REMOTE_ADMIN: process.env.MONGO_URI_REMOTE_ADMIN,
  MONGO_URI_LOCAL_ADMIN: process.env.MONGO_URI_LOCAL_ADMIN,
  MONGO_DB_NAME_ADMIN: process.env.MONGO_DB_NAME_ADMIN,

  //! =========== Authentication Layer ===========
  JWT: {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  },

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  FRONTEND_GOOGLE_CALLBACK_URL: process.env.FRONTEND_GOOGLE_CALLBACK_URL,

  //? Email configuration (Resend Email Service)
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  SUPPORT_EMAIL_TO: process.env.SUPPORT_EMAIL_TO,

  //? AWS S3 Configuration
  AWS_S3_REGION_APP: process.env.AWS_S3_REGION_APP,
  AWS_S3_ACCESS_KEY_ID_APP: process.env.AWS_S3_ACCESS_KEY_ID_APP,
  AWS_S3_SECRET_ACCESS_KEY_APP: process.env.AWS_S3_SECRET_ACCESS_KEY_APP,
  AWS_S3_BUCKET_APP: process.env.AWS_S3_BUCKET_APP,

  AWS_S3_REGION_CV_INSTRUCTOR_UPLOADS:
    process.env.AWS_S3_REGION_CV_INSTRUCTOR_UPLOADS,
  AWS_S3_ACCESS_KEY_ID_CV_INSTRUCTOR_UPLOADS:
    process.env.AWS_S3_ACCESS_KEY_ID_CV_INSTRUCTOR_UPLOADS,
  AWS_S3_SECRET_ACCESS_KEY_CV_INSTRUCTOR_UPLOADS:
    process.env.AWS_S3_SECRET_ACCESS_KEY_CV_INSTRUCTOR_UPLOADS,
  AWS_S3_BUCKET_CV_INSTRUCTOR_UPLOADS:
    process.env.AWS_S3_BUCKET_CV_INSTRUCTOR_UPLOADS,

  REDIS_URL: process.env.REDIS_URL,
  REDIS_PREFIX: process.env.REDIS_PREFIX?.trim() || 'vonova:app',
});
