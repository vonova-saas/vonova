export default () => ({
  //? =========== Backend Configuration ===========
  NATS_URL: process.env.NATS_URL,
  // NATS_USER: process.env.NATS_USER,
  // NATS_PASSWORD: process.env.NATS_PASSWORD,
  NODE_ENV: process.env.NODE_ENV,

  //* Database configuration (MongoDB),
  MONGO_URI_REMOTE: process.env.MONGO_URI_REMOTE,
  MONGO_URI_LOCAL: process.env.MONGO_URI_LOCAL,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME,

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

  //? AWS S3 Configuration
  AWS_S3_REGION: process.env.AWS_S3_REGION,
  AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID,
  AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
});
