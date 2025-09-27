import { z } from "zod";

export const presignVideoSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().min(1),
});

export const completeVideoSchema = z.object({
  objectKey: z.string().min(1),
});
