import { z } from "zod";

export const emailSchema = z
  .string({
    required_error: "Email is required",
  })
  .email("Invalid email address")
  .toLowerCase()
  .trim()
  .min(1);

export const passwordSchema = z
  .string({
    required_error: "Password is required",
  })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  );

// Register validation
export const registerSchema = z.object({
  name: z
    .string({
      required_error: "Name is required"
    }).
    min(2, "Name must be at least 2 characters").
    max(50, "Name must not exceed 50 characters").
    trim(),
  email: emailSchema,
  password: passwordSchema,
});

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Email verification validation
export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.
    string({
      required_error: "Verification code is required",
    })
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

// Request reset password validation
export const requestResetPasswordSchema = z.object({
  email: emailSchema
});

// Verify reset code validation
export const verifyResetCodeSchema = z.object({
  email: emailSchema,
  code: z
    .string({
      required_error: "Reset code is required",
    })
    .length(6, "Reset code must be 6 digits")
    .regex(/^\d{6}$/, "Reset code must contain only numbers"),
});

// Reset password validation
export const resetPasswordSchema = z.object({
  newPassword: z
    .string({
      required_error: "New password is required",
    })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

// Refresh token validation (if needed)
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({
      required_error: "Refresh token is required",
    })
    .min(1, "Refresh token is required"),
});

// Role change validation
export const validateRoleChangeSchema = z.object({
  userId: z
    .string({
      required_error: "User ID is required",
    })
    .min(1, "User ID is required"),
  newRole: z
    .string({
      required_error: "New role is required",
    })
    .min(1, "New role is required"),
  adminUserId: z
    .string({
      required_error: "Admin user ID is required",
    })
    .min(1, "Admin user ID is required"),
});

// Token verification validation
export const verifyTokenSchema = z.object({
  token: z
    .string({
      required_error: "Token is required",
    })
    .min(1, "Token is required"),
});