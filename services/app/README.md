# Vonova App Service (App + Auth) - NestJS Version

**Version:** 1.0.0-beta.1

Combined app + authentication service for the Vonova platform (Auth + Settings/Account/Billing/Support/Feedback APIs).

## 🚀 Features

- **Email/Password Authentication**: Registration, login, refresh, logout flows
- **OAuth Integration**: Google OAuth 2.0 authentication
- **JWT Tokens**: Access + refresh token issuance and rotation
- **Cookie-based Tokens**: Secure HTTP-only cookie-based token management
- **Email Verification**: OTP-based email verification
- **Password Reset**: OTP verification + reset token cookie + password update
- **Role-Based Access Control**: User roles and permissions system (PENDING / STUDENT_USER / INSTRUCTORS_USER / OWNER)
- **Instructor onboarding (CV upload)**: Optional CV upload to S3 during role selection (CV required for instructors)
- **User Settings APIs**: CRUD endpoints for user settings
- **Account APIs**: Read/update user account data
- **Billing APIs**: Read/update user billing data
- **Support APIs**: Ticketing with messages + status updates
- **Feedback APIs**: Feedback items with messages + status updates
- **Security middleware**: Helmet, CORS, request validation (whitelist + forbidUnknown), global exception filter
- **Documentation**: Swagger/OpenAPI docs (optionally protected with basic auth)
- **Configuration**: `.env.local` or `.env` supported + startup env validation with helpful errors

## 🛠️ Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js with JWT and Google OAuth strategies
- **Validation**: class-validator with DTOs
- **Email**: NodeMailer (SMTP) and optional Resend API key support
- **Security**: Helmet, CORS, cookie-based auth (HTTP-only cookies)
- **Documentation**: OpenAPI/Swagger with basic authentication
- **Caching**: Upstash Redis (optional) for rate limiting and caching

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB instance
- SMTP credentials (NodeMailer) and/or a Resend API key (optional, depending on email provider)
- Google OAuth credentials (for OAuth login)
- Environment variables configured

## 🔧 Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   **IMPORTANT:** The application requires certain environment variables to be set. The application will validate these at startup and exit with a clear error message if they are missing.

   Create a `.env` file in the service root directory (`services/app/`):

   **Option 1: Use the helper script (recommended)**

   ```bash
   node scripts/create-env.js
   ```

   This will create a `.env` file with all required variables.

   **Option 2: Create manually**
   Create a `.env` file with the following content:

   ```env
   # Server Configuration
   PORT=4001
   NODE_ENV=development
   FRONTEND_ORIGIN=http://localhost:3000

   # Database
   MONGO_URI_RMOTE=mongodb://localhost:27017/vonova_auth

   # JWT Configuration (REQUIRED - Change these in production!)
   JWT_ACCESS_SECRET=your-access-secret-key-min-32-chars
   JWT_ACCESS_EXPIRES_IN=1d
   JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
   JWT_REFRESH_EXPIRES_IN=7d

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:4001/api/v1/auth/google/callback
   FRONTEND_GOOGLE_CALLBACK_URL=http://localhost:3000/auth/callback

   # Email Configuration (SMTP / NodeMailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@vonova.tech

   # Email Configuration (Optional - Resend)
   RESEND_API_KEY=your-resend-api-key

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
   CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With
   CORS_CREDENTIALS=true

   # Swagger (Optional)
   SWAGGER_USER=admin
   SWAGGER_PASSWORD=vonova2024
   BASE_URL=http://localhost:4001

   # Rate Limiting (Optional)
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   GLOBAL_RATE_LIMIT_WINDOW_MS=60000
   GLOBAL_RATE_LIMIT_MAX_REQUESTS=1000
   STRICT_RATE_LIMIT_WINDOW_MS=60000
   STRICT_RATE_LIMIT_MAX_REQUESTS=10

   # Redis/Upstash (Optional - for rate limiting)
   UPSTASH_REDIS_REST_URL=your-upstash-redis-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

   # Internal Service Communication (Optional)
   INTERNAL_API_SECRET_KEY=your-internal-api-secret
   GATEWAY_SIGNING_SECRET=your-gateway-signing-secret
   APP_SERVICE_URL=http://localhost:4001
   LMS_SERVICE_URL=http://localhost:4002
   LMS_AI_SERVICE_URL=http://localhost:4003

   # AWS S3 Configuration (Required for CV uploads)
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   AWS_REGION=eu-north-1
   AWS_S3_BUCKET=your-s3-bucket-name
   AWS_S3_PUBLIC_URL_PREFIX=https://your-bucket.s3.region.amazonaws.com
   ```

3. **Start the service**

### Create OWNER (admin) users (optional)

This project includes a script to seed one or more OWNER users.

```bash
# from: services/app
npm run create:admins
```

   ```bash
   # Development mode (with hot reload)
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

   **Note:** If you see an error about missing environment variables, the application will display a helpful message listing which variables are missing and how to fix it. Make sure your `.env` file is in the `services/app/` directory.

## Quick Start

### 1. Register a new user

```bash
curl -X POST http://localhost:4001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 2. Verify email

```bash
curl -X POST http://localhost:4001/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "code": "123456"
  }'
```

### 3. Welcome user (set role)

```bash
curl -X POST http://localhost:4001/api/v1/auth/welcome-email-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "role": "STUDENT_USER",
    "answerOne": "Answer to question"
  }'
```

### 4. Login

```bash
curl -X POST http://localhost:4001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 5. Get current user

```bash
curl -X GET http://localhost:4001/api/v1/auth/currentUser \
  -H "Cookie: accessToken=your-access-token"
```

**Note:** Tokens are automatically set as HTTP-only cookies by the service. For cookie-based requests, include cookies in your curl command using the `-b` flag or use a browser/client that handles cookies automatically.

### 6. Refresh token

```bash
curl -X GET http://localhost:4001/api/v1/auth/refresh \
  -H "Cookie: refreshToken=your-refresh-token"
```

### 7. Access Swagger Documentation

Navigate to `http://localhost:4001/api-docs` and use the Swagger credentials:

- Username: `admin` (or your configured `SWAGGER_USER`)
- Password: `vonova2024` (or your configured `SWAGGER_PASSWORD`)

## 📚 API Endpoints

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register a new user (sends verification code via email)
- `POST /api/v1/auth/verify-email` - Verify email with 6-digit OTP code
- `POST /api/v1/auth/welcome-email-user` - Set user role after email verification (sets access/refresh tokens as cookies)
- `POST /api/v1/auth/login` - Login with email and password (sets access/refresh tokens as cookies)
- `GET /api/v1/auth/google` - Initiate Google OAuth login (redirects to Google)
- `GET /api/v1/auth/google/callback` - Google OAuth callback (handles OAuth flow, redirects to frontend)
- `POST /api/v1/auth/welcome-oauth-google` - Set role for OAuth users (requires providerId cookie, sets tokens as cookies)
- `GET /api/v1/auth/refresh` - Refresh access token (requires refreshToken cookie)
- `GET /api/v1/auth/currentUser` - Get current authenticated user (requires accessToken cookie)

### User Management Endpoints

- `GET /api/v1/auth/instructors` - Get all users with INSTRUCTORS_USER role
- `GET /api/v1/auth/students` - Get all users with STUDENT_USER role

### App / Settings Endpoints

- `POST /api/v1/settings` - Create user settings
- `GET /api/v1/settings` - List all user settings
- `GET /api/v1/settings/user/:userId` - Get settings for a user
- `PATCH /api/v1/settings/user/:userId` - Update settings for a user
- `DELETE /api/v1/settings/user/:userId` - Delete settings for a user

### App / Account Endpoints

- `GET /api/v1/account/:userId` - Get user account (reads `x-user-name` and `x-user-email` headers if present)
- `PUT /api/v1/account/:userId` - Update user account

### App / Billing Endpoints

- `GET /api/v1/billing/:userId` - Get user billing
- `PUT /api/v1/billing/:userId` - Update user billing

### App / Support Endpoints

- `POST /api/v1/support/:userId/add` - Create a support ticket
- `GET /api/v1/support/:userId` - List support tickets
- `GET /api/v1/support/:userId/:id` - Get a support ticket by id
- `PUT /api/v1/support/:userId/:id` - Update a support ticket
- `DELETE /api/v1/support/:userId/:id` - Delete a support ticket
- `POST /api/v1/support/:userId/:id/messages` - Add a message to a ticket
- `GET /api/v1/support/:userId/:id/messages` - Get ticket messages
- `PUT /api/v1/support/:userId/:id/status` - Update ticket status

### App / Feedback Endpoints

- `POST /api/v1/feedback/:userId/add` - Create feedback
- `GET /api/v1/feedback/:userId` - List feedback items
- `GET /api/v1/feedback/:userId/:id` - Get feedback by id
- `PUT /api/v1/feedback/:userId/:id` - Update feedback
- `DELETE /api/v1/feedback/:userId/:id` - Delete feedback
- `POST /api/v1/feedback/:userId/:id/messages` - Add a message to feedback
- `GET /api/v1/feedback/:userId/:id/messages` - Get feedback messages
- `PUT /api/v1/feedback/:userId/:id/status` - Update feedback status

### Password Reset Endpoints

- `POST /api/v1/auth/request-resetPass` - Request password reset code (sends 6-digit code via email)
- `POST /api/v1/auth/verify-resetPass-code` - Verify password reset code (sets resetToken cookie)
- `POST /api/v1/auth/reset-password` - Reset password with token (requires resetToken cookie)

### Logout Endpoints

- `POST /api/v1/auth/logout` - Logout current device (requires refreshToken cookie, clears auth cookies)
- `POST /api/v1/auth/logout-all` - Logout all devices (requires refreshToken cookie, invalidates all user tokens)

### Utility Endpoints

- `POST /api/v1/auth/validate-role-change` - Validate and change user role (owner only, requires accessToken cookie)
- `POST /api/v1/auth/verify-and-permissions` - Verify token and get permissions (internal service endpoint, requires accessToken cookie)

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **Password Hashing**: bcrypt for password encryption
- **Email Verification**: 6-digit OTP-based email verification (10-minute expiration)
- **Refresh Tokens**: Secure token rotation with device tracking
- **Device Tracking**: Device hash for security and device-specific token management
- **CORS Protection**: Configurable cross-origin resource sharing with whitelist/blacklist support
- **Input Validation**: Comprehensive request validation with class-validator and DTOs
- **Global Validation**: Whitelisting + rejecting unknown fields (NestJS `ValidationPipe`)
- **Security Headers**: Helmet.js security headers
- **Cookie Security**: HttpOnly, Secure, SameSite cookie settings (production: SameSite=None, development: SameSite=Lax)
- **Token Rotation**: Automatic refresh token rotation on each refresh for enhanced security
- **Attack Detection**: Automatic token revocation on device mismatch or suspicious activity

## 👥 User Roles

- **PENDING**: New users awaiting role assignment (default role after registration)
- **STUDENT_USER**: Students with learning permissions
- **INSTRUCTORS_USER**: Instructors with teaching permissions
- **OWNER**: Platform owners with full access to all permissions and administrative capabilities

**Note:** Users must verify their email and set a role (STUDENT_USER or INSTRUCTORS_USER) before they can fully access the platform. OAuth users are automatically verified but still need to set their role. OWNER role can only be assigned through the database or creation script.

## 📊 Project Structure

```text
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module (wires feature modules)
├── app.controller.ts                # Health/root endpoints
├── app.service.ts                   # App service
├── auth/                            # Auth module (email/password + Google OAuth)
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── email.service.ts
│   ├── dto/
│   │   └── auth.dto.ts
│   ├── schemas/
│   │   ├── user.schema.ts
│   │   ├── account.schema.ts
│   │   ├── refresh-token.schema.ts
│   │   ├── email-verification.schema.ts
│   │   └── password-reset.schema.ts
│   └── strategies/
│       └── google.strategy.ts
├── settings/                        # App settings domain
│   ├── settings/                    # User settings CRUD
│   ├── account/                     # User account profile endpoints
│   ├── billing/                     # Billing endpoints
│   ├── support/                     # Support/ticketing endpoints (folder name: supoort)
│   └── feedback/                    # Feedback endpoints
├── schemas/                         # Mongoose schemas for app domains
│   ├── UserSettings.schema.ts
│   ├── userAccount.shema.ts
│   ├── userBilling.schema.ts
│   ├── support.schema.ts
│   └── feedback.schemas.ts
├── config/                          # Environment + http/database config
│   ├── env.config.ts
│   ├── env-validation.ts
│   ├── http.config.ts
│   └── database.config.ts
├── database/                        # Database module
│   └── database.module.ts
├── common/
│   └── filters/
│       └── http-exception.filter.ts
├── enums/
│   ├── role.enum.ts
│   ├── account-provider.enum.ts
│   └── error-code.enums.ts
├── utils/
│   ├── appError.ts
│   ├── bcrypt.ts
│   ├── jwt.ts
│   ├── get-env.ts
│   ├── role-permission.ts
│   ├── logger.ts
│   └── s3.ts
└── test-utils/
    └── test-helpers.ts
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 🐳 Docker

```bash
# Build image
docker build -t vonova-app .

# Run container
docker run -p 4001:4001 \
  -e MONGO_URI_RMOTE=mongodb://host.docker.internal:27017/vonova_auth \
  -e JWT_ACCESS_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-secret \
  -e EMAIL_HOST=smtp.gmail.com \
  -e EMAIL_PORT=465 \
  -e EMAIL_SECURE=true \
  -e EMAIL_USER=your-email@gmail.com \
  -e EMAIL_PASSWORD=your-app-password \
  -e EMAIL_FROM=noreply@vonova.tech \
  vonova-app
```

## 🔧 Configuration

### Environment Variables

| Variable                      | Default                                                          | Description                                    |
|-------------------------------|------------------------------------------------------------------|------------------------------------------------|
| `PORT`                         | `4001`                                                            | Service port                                   |
| `NODE_ENV`                     | `development`                                                     | Environment mode                               |
| `BASE_URL`                     | `http://localhost:4001`                                           | Base URL for Swagger docs                      |
| `FRONTEND_ORIGIN`              | `http://localhost:3000`                                          | Frontend application URL                       |
| `MONGO_URI_RMOTE`              | `mongodb://localhost:27017/vonova_auth`                          | MongoDB connection string                      |
| `JWT_ACCESS_SECRET`            | `dev-access-secret-key-change-in-production`                     | JWT access token secret                        |
| `JWT_ACCESS_EXPIRES_IN`        | `1d`                                                              | Access token expiration                        |
| `JWT_REFRESH_SECRET`           | `dev-refresh-secret-key-change-in-production`                    | JWT refresh token secret                       |
| `JWT_REFRESH_EXPIRES_IN`       | `7d`                                                              | Refresh token expiration                       |
| `GOOGLE_CLIENT_ID`             | -                                                                 | Google OAuth client ID                         |
| `GOOGLE_CLIENT_SECRET`         | -                                                                 | Google OAuth client secret                     |
| `GOOGLE_CALLBACK_URL`          | `http://localhost:4001/api/v1/auth/google/callback`               | Google OAuth callback URL                      |
| `FRONTEND_GOOGLE_CALLBACK_URL` | `http://localhost:3000/auth/oauth-callback`                       | Frontend OAuth callback URL                   |
| `EMAIL_HOST`                   | -                                                                 | SMTP server host (e.g., smtp.gmail.com)        |
| `EMAIL_PORT`                   | `465`                                                             | SMTP server port (465 for SSL, 587 for TLS)   |
| `EMAIL_SECURE`                 | `true`                                                            | Use SSL/TLS (true for 465, false for 587)     |
| `EMAIL_USER`                   | -                                                                 | SMTP username/email address                    |
| `EMAIL_PASSWORD`               | -                                                                 | SMTP password or app password                 |
| `EMAIL_FROM`                   | -                                                                 | Email sender address                           |
| `SWAGGER_USER`                 | `admin`                                                           | Swagger UI basic auth username                 |
| `SWAGGER_PASSWORD`             | `vonova2024`                                                      | Swagger UI basic auth password                 |
| `CORS_ORIGIN`                  | `http://localhost:3000`                                          | CORS allowed origins (comma-separated)         |
| `CORS_METHODS`                 | `GET,POST,PUT,DELETE,OPTIONS`                                     | CORS allowed methods (comma-separated)         |
| `CORS_ALLOWED_HEADERS`         | `Content-Type,Authorization,X-Requested-With`                     | CORS allowed headers (comma-separated)         |
| `CORS_CREDENTIALS`             | `true`                                                            | CORS credentials flag                          |
| `UPSTASH_REDIS_REST_URL`       | -                                                                 | Upstash Redis REST URL (optional)              |
| `UPSTASH_REDIS_REST_TOKEN`     | -                                                                 | Upstash Redis REST token (optional)            |
| `INTERNAL_API_SECRET_KEY`      | -                                                                 | Internal API secret for service-to-service auth|
| `GATEWAY_SIGNING_SECRET`       | -                                                                 | Gateway signing secret for auth context        |

## 🚨 Error Handling

The service includes comprehensive error handling:

- **Validation Errors**: Detailed validation error messages with class-validator
- **Authentication Errors**: Clear unauthorized/forbidden messages
- **Database Errors**: Database connection and query error handling
- **Email Errors**: Email service error handling
- **Token Errors**: JWT validation and expiration handling

## 📈 Performance

- **Token Rotation**: Secure refresh token rotation on each refresh
- **Device Management**: Per-device token tracking with device hash
- **Database Indexing**: Optimized database queries with Mongoose
- **Connection Pooling**: MongoDB connection optimization
- **Request Validation**: Early validation to prevent unnecessary processing
- **Token Cleanup**: Automatic cleanup of old refresh tokens on device login
- **Efficient Token Storage**: Hashed token storage for security

## 🔄 Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Code Quality
npm run lint               # Lint code
npm run format             # Format code with Prettier

# Testing
npm test                   # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
```

### Adding New Features

1. **Create DTOs**: Add validation schemas with class-validator
2. **Implement Service**: Add business logic with dependency injection
3. **Create Controller**: Handle HTTP requests with decorators
4. **Update Documentation**: Add Swagger docs
5. **Add Tests**: Write unit and integration tests

## 📝 Important Notes

### Cookie-Based Authentication

This service uses HTTP-only cookies for token management:

- **Access Token**: Set as `accessToken` cookie (1 day expiration)
- **Refresh Token**: Set as `refreshToken` cookie (7 days expiration)
- **Reset Token**: Set as `resetToken` cookie (10 minutes expiration, for password reset)
- **Provider ID**: Set as `providerId` cookie (temporary, for OAuth flow)

Cookies are automatically:

- **HttpOnly**: Not accessible via JavaScript (XSS protection)
- **Secure**: Only sent over HTTPS in production
- **SameSite**: `none` in production (for cross-origin), `lax` in development

### Email Verification Flow

1. User registers → receives 6-digit OTP code via email (expires in 10 minutes)
2. User verifies email with OTP code
3. User sets role via `welcome-email-user` endpoint
4. Tokens are issued and set as cookies

### OAuth Flow

1. User initiates Google OAuth → redirected to Google
2. Google callback → user created/updated, tokens issued if role exists
3. If new user or PENDING role → redirected to frontend welcome screen
4. User sets role via `welcome-oauth-google` endpoint (requires providerId cookie)
5. Tokens are issued and set as cookies

### Password Reset Flow

1. User requests reset → receives 6-digit code via email (expires in 15 minutes)
2. User verifies code → resetToken cookie is set (expires in 10 minutes)
3. User resets password with new password → all tokens revoked for security

## 🔮 Roadmap

- [ ] Facebook OAuth integration
- [ ] Two-factor authentication (2FA)
- [ ] Account recovery options
- [ ] Session management dashboard
- [ ] Advanced rate limiting with Redis
- [ ] Audit logging
- [ ] Social login improvements
- [ ] Email template customization
- [ ] Multi-language support
