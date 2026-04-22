# Admin Authentication System

A **fully isolated Admin Authentication System** with complete separation from normal user authentication, including a dedicated MongoDB database.

## 🎯 Overview

This system provides secure, OTP-based authentication for administrators with the following key features:

- **Separate Database**: Admins stored in a completely separate MongoDB database
- **OTP-Based Login**: Two-factor authentication using email OTP codes
- **Strict Access Control**: Admins defined only via environment variables
- **Mandatory Password Reset**: Temporary passwords must be changed on first login
- **Rate Limiting**: Built-in protection against brute force attacks
- **Full Isolation**: No shared models or endpoints with regular user authentication

---

## 🏗️ Architecture

### Database Separation

```
┌─────────────────────┐         ┌─────────────────────┐
│   Main Database     │         │   Admin Database    │
│  (vonova_app)       │         │  (vonova_admin)     │
├─────────────────────┤         ├─────────────────────┤
│ User                │         │ Admin               │
│ Account             │         │ AdminOtp            │
│ Settings            │         │                     │
│ ...                 │         │                     │
└─────────────────────┘         └─────────────────────┘
```

### Models

#### Admin Schema (Admin DB)
```typescript
{
  email: string,           // Unique admin email
  password: string,        // Bcrypt hashed password
  isTempPassword: boolean, // True for seeded admins
  role: 'admin',          // Immutable role
  createdAt: Date,
  updatedAt: Date
}
```

#### AdminOtp Schema (Admin DB)
```typescript
{
  email: string,          // Admin email
  code: string,           // 6-digit OTP
  expiresAt: Date,        // Expiration timestamp (10 min)
  used: boolean,          // Prevents OTP reuse
  failedAttempts: number, // Tracks verification attempts
  createdAt: Date,
  updatedAt: Date
}
```

---

## ⚙️ Configuration

### Environment Variables

Add these to your `.env` file:

```env
# ============================================
# Admin Database Configuration (CRITICAL)
# ============================================
MONGO_URI_LOCAL_ADMIN=mongodb://127.0.0.1:27017/vonova_admin
MONGO_URI_REMOTE_ADMIN=mongodb+srv://user:pass@cluster.mongodb.net/vonova_admin

# Optional: Override database name
MONGO_DB_NAME_ADMIN=vonova_admin

# ============================================
# Admin Seed Configuration
# ============================================
SEED_ADMINS_ON_BOOT=true
SEEDED_ADMIN_TEMP_PASSWORD=Temp@12345

# Define admin emails (only these can be admins)
ADMIN_EMAIL_1=admin1@example.com
ADMIN_EMAIL_2=admin2@example.com
ADMIN_EMAIL_3=admin3@example.com

# ============================================
# Email Configuration (for OTP delivery)
# ============================================
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# ============================================
# JWT Configuration (shared with user auth)
# ============================================
JWT_ACCESS_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=1h
```

### Database Setup

The admin database is automatically initialized when the application starts. Ensure MongoDB is running and accessible at the configured URI.

---

## 🔐 Admin Authentication Flow

### Step 1: Request Login Code

**Endpoint**: `POST /api/v1/admin/auth/request-login-code`

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "Temp@12345"
}
```

**Response**:
```json
{
  "message": "OTP sent to vonovacompany@gmail.com"
}
```

**Process**:
1. Validates email is in admin allowlist (ADMIN_EMAIL_1, ADMIN_EMAIL_2, ADMIN_EMAIL_3)
2. Verifies password against admin database
3. Enforces rate limiting (max 3 requests per 5 minutes, 30s cooldown)
4. Generates 6-digit OTP using `crypto.randomInt(100000, 999999)`
5. Stores OTP in AdminOtp collection (invalidates previous OTPs)
6. Sends OTP via email to `vonovacompany@gmail.com` (async, non-blocking)

**Rate Limiting**:
- Maximum 3 OTP requests per 5 minutes per email
- Minimum 30 seconds cooldown between requests

---

### Step 2: Verify Login

**Endpoint**: `POST /api/v1/admin/auth/verify-login`

**Request**:
```json
{
  "email": "admin@example.com",
  "code": "123456"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Process**:
1. Validates OTP exists and is not expired (10 minutes validity)
2. Checks OTP is not already used
3. Verifies OTP code matches
4. Tracks failed attempts (max 5 attempts before invalidation)
5. Marks OTP as used
6. Generates JWT with payload: `{ sub: adminId, role: 'admin' }`
7. Returns access token

**JWT Payload**:
```json
{
  "sub": "admin_id_here",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

### Step 3: Reset Password

**Endpoint**: `POST /api/v1/admin/auth/reset-password`

**Authentication**: Required (Bearer Token)

**Request**:
```json
{
  "oldPassword": "Temp@12345",
  "newPassword": "MyStr0ng!NewSecret"
}
```

**Response**:
```json
{
  "message": "Password updated successfully"
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&#^()_+-=[]{}...)

**Process**:
1. Extracts admin ID from JWT token
2. Fetches admin from Admin collection
3. Verifies old password using bcrypt
4. Validates new password meets requirements
5. Ensures new password differs from old password
6. Hashes new password with bcrypt (10 rounds)
7. Updates password and sets `isTempPassword = false`

---

## 🌱 Admin Seeding

### Automatic Seeding on Boot

When `SEED_ADMINS_ON_BOOT=true`, admins are automatically created on application startup.

**Seeded Admins**:
- Email: From `ADMIN_EMAIL_1`, `ADMIN_EMAIL_2`, `ADMIN_EMAIL_3`
- Password: From `SEEDED_ADMIN_TEMP_PASSWORD` (default: `Temp@12345`)
- `isTempPassword`: `true` (must be changed on first login)
- Role: `admin` (immutable)

**Idempotent Seeding**:
- Only creates admins that don't exist
- Skips existing admins (logs a message)
- Safe to run multiple times

### Manual Seeding (if needed)

If `SEED_ADMINS_ON_BOOT=false`, you can manually seed admins by calling the seeder service directly.

---

## 🔒 Security Features

### 1. Mandatory Password Change

Seeded admins have `isTempPassword = true`. They **cannot** access any protected endpoints except `/reset-password` until they change their password.

**Enforcement**: `AdminTempPasswordGuard` blocks access to protected endpoints.

### 2. Rate Limiting

**OTP Request Limits**:
- Max 3 requests per 5 minutes per email
- 30-second cooldown between requests
- Prevents brute force attacks

**OTP Verification Limits**:
- Max 5 failed attempts per OTP
- OTP invalidated after max attempts
- Must request new OTP

### 3. Admin Allowlist

Only emails defined in `ADMIN_EMAIL_1`, `ADMIN_EMAIL_2`, `ADMIN_EMAIL_3` can be admins.

**Forbidden Operations**:
- Creating admins via API → `ForbiddenException`
- Updating user role to "admin" → `ForbiddenException`
- Admin login to user endpoints → `ForbiddenException`

### 4. Separate Authentication

Admins **cannot** use:
- `POST /api/v1/auth/login` (user login)
- `POST /api/v1/auth/register` (user registration)
- Any user-specific endpoints

If attempted → `ForbiddenException("Admins must use admin auth endpoints")`

### 5. OTP Expiration

- OTPs expire after **10 minutes**
- Automatic cleanup via MongoDB TTL index
- One-time use only (marked as `used = true`)

### 6. Password Hashing

- Uses bcrypt with 10 salt rounds
- Pre-save hook on Admin schema
- Secure comparison using `bcrypt.compare()`

---

## 🧪 Testing

### 1. Test Admin Seeding

```bash
# Set environment variables
SEED_ADMINS_ON_BOOT=true
SEEDED_ADMIN_TEMP_PASSWORD=Temp@12345
ADMIN_EMAIL_1=test@example.com

# Start the application
npm run start:dev

# Check logs for:
# "✓ Seeded admin in admin database: test@example.com"
```

### 2. Test OTP Login Flow

```bash
# Step 1: Request OTP
curl -X POST http://localhost:3000/api/v1/admin/auth/request-login-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Temp@12345"}'

# Check email at vonovacompany@gmail.com for OTP

# Step 2: Verify OTP
curl -X POST http://localhost:3000/api/v1/admin/auth/verify-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'

# Save the access_token from response
```

### 3. Test Password Reset

```bash
curl -X POST http://localhost:3000/api/v1/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"oldPassword":"Temp@12345","newPassword":"MyStr0ng!Pass123"}'
```

### 4. Test Rate Limiting

```bash
# Send 4 requests rapidly (should get rate limited)
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/v1/admin/auth/request-login-code \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Temp@12345"}'
  echo "\n"
done

# Expected: 4th request returns 400 with rate limit message
```

---

## ⚡ Performance Optimizations

### 1. Non-Blocking Email Sending

OTP emails are sent asynchronously using fire-and-forget pattern:

```typescript
this.sendOtpEmailAsync(email, code).catch((err) => {
  this.logger.error(`Failed to send OTP email: ${err.message}`);
});
```

**Result**: API response < 500ms (email sending doesn't block)

### 2. Efficient Database Queries

- Indexed fields: `email`, `expiresAt`
- TTL index for automatic OTP cleanup
- Single query for admin lookup

### 3. In-Memory Rate Limiting

Current implementation uses in-memory Map for rate limiting.

**Production Recommendation**: Use Redis for:
- Distributed rate limiting across instances
- Persistent rate limit state
- Better scalability

---

## 🚀 Production Recommendations

### 1. Use BullMQ for Email Queue

```typescript
// Add to package.json
"@nestjs/bull": "^10.0.0",
"bull": "^4.11.0"

// Create email queue
@InjectQueue('email')
private emailQueue: Queue
```

**Benefits**:
- Retry with exponential backoff
- Job persistence
- Better error handling
- Performance monitoring

### 2. Redis for Rate Limiting

```typescript
// Use Redis instead of in-memory Map
await this.redis.incr(`otp:${email}:count`);
await this.redis.expire(`otp:${email}:count`, 300); // 5 min TTL
```

### 3. Audit Logging

Add audit logs for:
- Admin login attempts (success/failure)
- Password changes
- OTP requests
- Rate limit violations

### 4. Monitoring

Track metrics:
- OTP generation time
- Email send time
- Login success rate
- Failed login attempts

---

## 📁 File Structure

```
admin-auth/
├── admin-auth.controller.ts       # HTTP + NATS endpoints
├── admin-auth.service.ts          # Business logic
├── admin-auth.module.ts           # Module definition
├── admin-seeder.service.ts        # Admin seeding on boot
├── schemas/
│   ├── admin.schema.ts            # Admin model (admin DB)
│   └── admin-otp.schema.ts        # AdminOtp model (admin DB)
├── dto/
│   ├── request-login-code.dto.ts  # Request OTP DTO
│   ├── verify-login.dto.ts        # Verify OTP DTO
│   └── reset-password.dto.ts      # Password reset DTO
├── guards/
│   ├── admin-jwt-auth.guard.ts    # JWT authentication guard
│   └── admin-temp-password.guard.ts # Temp password check guard
├── strategies/
│   └── admin-jwt.strategy.ts      # Passport JWT strategy
└── README.md                      # This file
```

---

## 🔧 Troubleshooting

### Issue: "Admin not found"

**Cause**: Admin not seeded in admin database.

**Solution**:
1. Check `SEED_ADMINS_ON_BOOT=true` in `.env`
2. Verify `ADMIN_EMAIL_1` is set correctly
3. Restart application to trigger seeding
4. Check logs for seeding confirmation

### Issue: "OTP has expired"

**Cause**: OTP older than 10 minutes.

**Solution**: Request a new OTP.

### Issue: "Too many OTP requests"

**Cause**: Rate limit exceeded (3 requests per 5 minutes).

**Solution**: Wait for the rate limit window to reset.

### Issue: "MongoDB Admin URI is missing"

**Cause**: `MONGO_URI_LOCAL_ADMIN` or `MONGO_URI_REMOTE_ADMIN` not set.

**Solution**: Add admin database URI to `.env`.

### Issue: "RESEND_API_KEY is required"

**Cause**: Email service not configured.

**Solution**: Add Resend API key to `.env`.

---

## 📝 Notes

1. **Email Destination**: All OTPs are sent to `vonovacompany@gmail.com` for centralized admin notifications.

2. **Database Isolation**: The admin database is completely separate. No cross-database queries or shared collections.

3. **JWT Secret**: Admin JWT uses the same `JWT_ACCESS_SECRET` as user auth, but tokens are distinguished by the `role` claim.

4. **Password Validation**: Regex enforces strict password requirements. Consider using a library like `zxcvbn` for additional strength checking.

5. **Scalability**: For multiple app instances, migrate rate limiting and OTP storage to Redis.

---

## 📚 Related Documentation

- [Admin Allowlist Implementation](../common/admin/admin-allowlist.ts)
- [Email Sender Service](../notification/email-sender.service.ts)
- [MongoDB Admin Config](../common/config/mongo-admin.config.ts)

---

## 🤝 Contributing

When modifying this system:

1. ✅ DO maintain complete separation from user auth
2. ✅ DO add audit logging for security events
3. ✅ DO test all rate limiting scenarios
4. ✅ DO validate admin allowlist on every request
5. ❌ DON'T allow admin creation via API
6. ❌ DON'T share models with user database
7. ❌ DON'T skip password validation
8. ❌ DON'T remove OTP expiration

---

**Last Updated**: 2024
**Maintained By**: Vonova Backend Team