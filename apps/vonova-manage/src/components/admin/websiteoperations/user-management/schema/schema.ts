import { z } from "zod"

export const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["admin", "moderator", "user"], {
    message: "Please select a role.",
  }),
  status: z.enum(["active", "inactive", "suspended"], {
    message: "Please select a status.",
  }),
})