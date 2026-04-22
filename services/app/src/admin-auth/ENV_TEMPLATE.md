# Admin Authentication System - Environment Variables Template

Copy the required variables below to your `.env` file in `services/app/`.

---

## 🔴 CRITICAL - Admin Database Configuration

**These are REQUIRED and MUST be separate from your main application database.**

```env
# ============================================
# Admin Database (REQUIRED - Separate DB)
# ============================================

# Local Development Admin Database
MONGO_URI_LOCAL_ADMIN=mongodb://127.0.0.1:27017/vonova_admin

# Production Admin Database (uncomment when deploying)
# MONGO_URI_REMOTE_ADMIN=mongodb+srv://username:password@cluster.mongodb.net/vonova_admin?retryWrites=true&w=majority

# Optional: Override database name from URI
# MONGO_DB_NAME_ADMIN=vonova_admin
```

---

## 🔴 REQUIRED - Admin Seed Configuration

**These define which emails can be admins and their initial password.**

```env
# ============================================
# Admin Seed Configuration (REQUIRED)
# ============================================

# Auto-seed admins on application boot
# Set to 'true' to enable, 'false' to disable
SEED_ADMINS_ON_BOOT=true

# Temporary password for seeded admins (MUST be changed on first login)
# ⚠️ PRODUCTION: Use a strong, unique password
SEEDED_ADMIN_TEMP_PASSWORD=Temp@12345

# Define allowed admin emails (only these can be admins)
# At least ONE is required for the system to work
ADMIN_EMAIL_1=admin@yourdomain.com
ADMIN_EMAIL_2=admin2@yourdomain.com
ADMIN_EMAIL_3=admin3@yourdomain.com

# ⚠️ SECURITY NOTE:
# - Only emails defined here can be admins
# - Creating admins via API is FORBIDDEN
# - Changing user role to "admin" is FORBIDDEN
```

---

## 🔴 REQUIRED - Email Configuration (For OTP)

**Required for sending OTP codes via email.**

```env
# ============================================
# Email Configuration (REQUIRED for OTP)
# ============================================

# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx

# Email "From" address (must be verified in Resend)
EMAIL_FROM=noreply@yourdomain.com

# ℹ️ NOTE: All admin OTP emails are sent to vonovacompany@gmail.com
```

---

## 🔴 REQUIRED - JWT Configuration

**Shared with main application auth (if not already set).**

```env
# ============================================
# JWT Configuration (REQUIRED)
# ============================================

# JWT Access Token Secret (use strong random string)
JWT_ACCESS_SECRET=your-very-secure-secret-key-minimum-32-characters

# JWT Access Token Expiration
JWT_ACCESS_EXPIRES_IN=1h

# JWT Refresh Token Secret (use different secret from access)
JWT_REFRESH_SECRET=your-refresh-token-secret-key-minimum-32-characters

# JWT Refresh Token Expiration
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 🟢 OPTIONAL - Additional Configuration

```env
# ============================================
# Application Environment
# ============================================

# Node environment (development, production, test)
NODE_ENV=development

# ============================================
# Main Application Database
# ============================================

# Local Development Main Database (separate from admin DB)
MONGO_URI_LOCAL_APP=mongodb://127.0.0.1:27017/vonova_app

# Production Main Database
# MONGO_URI_REMOTE_APP=mongodb+srv://username:password@cluster.mongodb.net/vonova_app?retryWrites=true&w=majority

# Optional: Override database name
# MONGO_DB_NAME_APP=vonova_app
```

---

## 📋 Quick Setup Checklist

- [ ] Set `MONGO_URI_LOCAL_ADMIN` (or `MONGO_URI_REMOTE_ADMIN` for production)
- [ ] Set `SEED_ADMINS_ON_BOOT=true`
- [ ] Set `SEEDED_ADMIN_TEMP_PASSWORD` (change from default in production!)
- [ ] Set at least one `ADMIN_EMAIL_*` variable
- [ ] Set `RESEND_API_KEY` and `EMAIL_FROM`
- [ ] Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `NODE_ENV=development` or `production`

---

## 🔐 Security Best Practices

### For Development

```env
SEEDED_ADMIN_TEMP_PASSWORD=Temp@12345
JWT_ACCESS_SECRET=dev-secret-key-not-for-production
```

### For Production

```env
# Use strong, unique passwords
SEEDED_ADMIN_TEMP_PASSWORD=P@ssw0rd!2024#SecureTemp

# Use randomly generated secrets (min 32 characters)
JWT_ACCESS_SECRET=8f3a9c7e2d5b1f4a6c8e0d2b4f6a8c0e2d4b6f8a0c2e4d6f8a0c2e4d6f8a0c2e
JWT_REFRESH_SECRET=1b3d5f7a9c0e2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d
```

**Generate Secrets:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

---

## 📝 Complete Example .env

```env
# ============================================
# Admin Database (Separate from Main DB)
# ============================================
MONGO_URI_LOCAL_ADMIN=mongodb://127.0.0.1:27017/vonova_admin
# MONGO_URI_REMOTE_ADMIN=mongodb+srv://user:pass@cluster.mongodb.net/vonova_admin

# ============================================
# Admin Seed Configuration
# ============================================
SEED_ADMINS_ON_BOOT=true
SEEDED_ADMIN_TEMP_PASSWORD=Temp@12345
ADMIN_EMAIL_1=admin@example.com
ADMIN_EMAIL_2=admin2@example.com
ADMIN_EMAIL_3=admin3@example.com

# ============================================
# Email Configuration
# ============================================
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# ============================================
# JWT Configuration
# ============================================
JWT_ACCESS_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# Application
# ============================================
NODE_ENV=development
MONGO_URI_LOCAL_APP=mongodb://127.0.0.1:27017/vonova_app
```

---

## ⚠️ Important Notes

1. **Database Separation**: 
   - Admin DB (`vonova_admin`) MUST be different from App DB (`vonova_app`)
   - Never use the same database for both

2. **Admin Email Allowlist**:
   - Only emails in `ADMIN_EMAIL_1`, `ADMIN_EMAIL_2`, `ADMIN_EMAIL_3` can be admins
   - Maximum 3 admin emails supported (can be extended in code)

3. **Temporary Passwords**:
   - All seeded admins start with `isTempPassword = true`
   - MUST change password on first login
   - Cannot access protected endpoints until password is changed

4. **OTP Emails**:
   - All OTP codes are sent to `vonovacompany@gmail.com`
   - This is hardcoded for centralized admin notifications

5. **Rate Limiting**:
   - Max 3 OTP requests per 5 minutes per email
   - 30-second cooldown between requests
   - In-memory tracking (use Redis for production with multiple instances)

6. **Never Commit**:
   - Never commit `.env` file to version control
   - Add `.env` to `.gitignore`
   - Use environment variables or secrets management in production

---

## 🚀 Getting Started

1. Copy this template to `services/app/.env`
2. Replace placeholder values with real credentials
3. Ensure MongoDB is running
4. Start the application: `npm run start:dev`
5. Check logs for admin seeding confirmation

---

## 📞 Need Help?

- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for step-by-step setup
- See [README.md](./README.md) for complete documentation
- Check application logs for specific error messages

---

**Template Version**: 1.0.0  
**Last Updated**: 2024