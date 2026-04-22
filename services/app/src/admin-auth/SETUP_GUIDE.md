# Admin Authentication System - Setup Guide

Quick setup guide for the isolated Admin Authentication System with separate database.

---

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB running locally or remote connection string
- Resend API key for email delivery
- `.env` file configured

---

## 🚀 Quick Start

### Step 1: Configure Environment Variables

Add these to your `.env` file in `services/app/`:

```env
# ============================================
# Admin Database (REQUIRED - Separate from main DB)
# ============================================
# Local development
MONGO_URI_LOCAL_ADMIN=mongodb://127.0.0.1:27017/vonova_admin

# Production (uncomment when deploying)
# MONGO_URI_REMOTE_ADMIN=mongodb+srv://user:password@cluster.mongodb.net/vonova_admin

# ============================================
# Admin Seed Configuration (REQUIRED)
# ============================================
SEED_ADMINS_ON_BOOT=true
SEEDED_ADMIN_TEMP_PASSWORD=Temp@12345

# Define allowed admin emails (at least one required)
ADMIN_EMAIL_1=admin@yourdomain.com
ADMIN_EMAIL_2=admin2@yourdomain.com
ADMIN_EMAIL_3=admin3@yourdomain.com

# ============================================
# Email Configuration (REQUIRED for OTP)
# ============================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# ============================================
# JWT Configuration (REQUIRED)
# ============================================
JWT_ACCESS_SECRET=your-very-secure-secret-key-here
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# Node Environment
# ============================================
NODE_ENV=development
```

---

### Step 2: Verify MongoDB is Running

**Local MongoDB:**
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# If not running, start MongoDB
# macOS/Linux
sudo systemctl start mongodb

# Windows (if installed as service)
net start MongoDB
```

**Remote MongoDB:**
- Ensure your connection string is correct
- Whitelist your IP address in MongoDB Atlas

---

### Step 3: Install Dependencies

```bash
cd services/app
npm install
# or
pnpm install
```

---

### Step 4: Start the Application

```bash
npm run start:dev
# or
pnpm start:dev
```

**Expected Console Output:**
```
[AdminSeederService] Starting admin seed for 3 email(s) in admin database...
[AdminSeederService] ✓ Seeded admin in admin database: admin@yourdomain.com (temp password must be changed on first login)
[AdminSeederService] ✓ Seeded admin in admin database: admin2@yourdomain.com (temp password must be changed on first login)
[AdminSeederService] ✓ Seeded admin in admin database: admin3@yourdomain.com (temp password must be changed on first login)
[AdminSeederService] Admin seeding completed successfully.
```

---

### Step 5: Verify Database

```bash
# Connect to admin database
mongosh mongodb://127.0.0.1:27017/vonova_admin

# Check admins were created
db.admins.find().pretty()
```

**Expected Output:**
```json
{
  "_id": ObjectId("..."),
  "email": "admin@yourdomain.com",
  "password": "$2a$10$...", // Bcrypt hashed
  "isTempPassword": true,
  "role": "admin",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## 🧪 Testing the System

### Test 1: Request OTP Login Code

```bash
curl -X POST http://localhost:3000/api/v1/admin/auth/request-login-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "Temp@12345"
  }'
```

**Expected Response:**
```json
{
  "message": "OTP sent to vonovacompany@gmail.com"
}
```

**Check Email:**
- Go to vonovacompany@gmail.com
- Find email with subject "Admin Login OTP - Vonova"
- Copy the 6-digit code

---

### Test 2: Verify OTP and Get Token

```bash
curl -X POST http://localhost:3000/api/v1/admin/auth/verify-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "code": "123456"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token** - you'll need it for the next step.

---

### Test 3: Reset Password (Required for First Login)

```bash
curl -X POST http://localhost:3000/api/v1/admin/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "oldPassword": "Temp@12345",
    "newPassword": "MyStr0ng!Pass123"
  }'
```

**Expected Response:**
```json
{
  "message": "Password updated successfully"
}
```

---

### Test 4: Login with New Password

Repeat Test 1 and Test 2, but use your new password:

```bash
curl -X POST http://localhost:3000/api/v1/admin/auth/request-login-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "MyStr0ng!Pass123"
  }'
```

---

## ✅ Verification Checklist

- [ ] Admin database created (`vonova_admin`)
- [ ] Admin users seeded successfully
- [ ] Can request OTP code
- [ ] OTP email received at vonovacompany@gmail.com
- [ ] Can verify OTP and get JWT token
- [ ] Can reset password
- [ ] Can login with new password
- [ ] `isTempPassword` set to `false` in database after reset

---

## 🔧 Troubleshooting

### Issue: "MongoDB Admin URI is missing"

**Solution:**
```env
# Add to .env
MONGO_URI_LOCAL_ADMIN=mongodb://127.0.0.1:27017/vonova_admin
```

### Issue: "No admin emails configured"

**Solution:**
```env
# Add at least one admin email to .env
ADMIN_EMAIL_1=admin@yourdomain.com
```

### Issue: "RESEND_API_KEY is required"

**Solution:**
1. Sign up at https://resend.com
2. Get API key from dashboard
3. Add to `.env`:
```env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com
```

### Issue: "Admin not found"

**Causes:**
- `SEED_ADMINS_ON_BOOT` is not `true`
- Admin email doesn't match exactly (case-insensitive)
- Application didn't start successfully

**Solution:**
1. Set `SEED_ADMINS_ON_BOOT=true`
2. Restart application
3. Check logs for seeding confirmation

### Issue: "Invalid credentials"

**Causes:**
- Wrong password
- Email not in admin allowlist
- Admin not seeded

**Solution:**
1. Verify email is in `ADMIN_EMAIL_1`, `ADMIN_EMAIL_2`, or `ADMIN_EMAIL_3`
2. Use correct temporary password (default: `Temp@12345`)
3. Check application logs for errors

### Issue: "OTP has expired"

**Cause:** OTP is valid for 10 minutes only.

**Solution:** Request a new OTP.

### Issue: "Too many OTP requests"

**Cause:** Rate limit exceeded (max 3 requests per 5 minutes).

**Solution:** Wait 5 minutes and try again.

### Issue: "Please wait X seconds before requesting another OTP"

**Cause:** Cooldown period (30 seconds between requests).

**Solution:** Wait the specified time.

---

## 🔐 Password Requirements

When resetting password, ensure it meets these requirements:

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (@$!%*?&#^()_+-=[]{};':"\\|,.<>/~`)

**Valid Examples:**
- `MyStr0ng!Pass`
- `Admin@2024`
- `Secure#Pass123`

**Invalid Examples:**
- `password` (no uppercase, no number, no special char)
- `PASSWORD123` (no lowercase, no special char)
- `Pass@12` (too short)

---

## 📊 Database Collections

After successful setup, your admin database should have:

### `admins` Collection
```javascript
{
  email: "admin@yourdomain.com",
  password: "$2a$10$hashed_password",
  isTempPassword: false,  // true until password reset
  role: "admin",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### `adminotps` Collection
```javascript
{
  email: "admin@yourdomain.com",
  code: "123456",
  expiresAt: ISODate("..."),  // 10 minutes from creation
  used: true,                  // false until verified
  failedAttempts: 0,          // incremented on wrong code
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 🎯 Next Steps

After successful setup:

1. **Change Default Password**: All seeded admins should reset their temporary password
2. **Secure Environment Variables**: Never commit `.env` to version control
3. **Test Rate Limiting**: Verify protection mechanisms work
4. **Monitor Logs**: Check for any authentication failures
5. **Production Setup**: Use `MONGO_URI_REMOTE_ADMIN` for production

---

## 📝 Adding More Admins

### Option 1: Environment Variables (Recommended)

```env
ADMIN_EMAIL_1=admin1@example.com
ADMIN_EMAIL_2=admin2@example.com
ADMIN_EMAIL_3=newadmin@example.com  # Add new admin
```

Then restart the application. The seeder will create the new admin automatically.

### Option 2: Manually in Database

**⚠️ Not Recommended** - Use environment variables instead for consistency.

```javascript
// In mongosh
use vonova_admin

db.admins.insertOne({
  email: "newadmin@example.com",
  password: "$2a$10$...",  // Must be bcrypt hashed
  isTempPassword: true,
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Important:** Don't forget to also add the email to your allowlist in the code!

---

## 🚀 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGO_URI_REMOTE_ADMIN=mongodb+srv://user:pass@cluster.mongodb.net/vonova_admin
SEED_ADMINS_ON_BOOT=true
SEEDED_ADMIN_TEMP_PASSWORD=YourSecureTemp@Pass2024
```

### Security Recommendations

1. **Use Strong Temp Password**: Don't use `Temp@12345` in production
2. **Secure MongoDB**: Enable authentication and SSL/TLS
3. **IP Whitelist**: Restrict MongoDB access to your servers
4. **Monitor Failed Attempts**: Set up alerts for suspicious activity
5. **Rotate JWT Secrets**: Change secrets periodically
6. **Use Redis**: Implement Redis for rate limiting across instances

---

## 📞 Support

For issues or questions:

1. Check the [README.md](./README.md) for detailed documentation
2. Review application logs for error messages
3. Verify all environment variables are set correctly
4. Check MongoDB connection and database creation

---

**Setup Complete! 🎉**

Your admin authentication system is now ready to use.