//! App hooks imports
import { useIsMobile } from "./app/use-mobile";
import { useToast } from "./app/use-toast";
import { toast } from "./app/use-toast";
//? =========== Auth hooks imports ===========
import useAuth from "./app/auth/use-auth";
//? =========== Settings hooks imports ===========
//? =========== Account hooks imports ===========
//? =========== Billing hooks imports ===========
//? =========== Notification hooks imports ===========
//? =========== Support hooks imports ===========
//? =========== Feedback hooks imports ===========

//! User hooks imports
//! Site hooks imports

import useUserId from "./user/use-user-id";
//? =========== Courses hooks imports ===========
import { tryCatch } from "./courses/try-catch";
import { useConfetti } from "./courses/use-confetti";
import useConstructUrl from "./courses/use-construct-url";

export {
  // App Hooks
  useIsMobile,
  useToast,
  toast,
  // Auth Hooks
  useAuth,
  // Settings Hooks
  // Account Hooks
  // Billing Hooks
  // Notification Hooks
  // Support Hooks
  // Feedback Hooks

  // User Hooks
  // Site Hooks
  useUserId,

  // Courses Hooks
  tryCatch,
  useConfetti,
  useConstructUrl,
}