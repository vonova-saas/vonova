import { z } from "zod";

export const presignLibraryFileSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().min(1),
});

export const completeLibraryFileSchema = z.object({
  assetId: z.string().min(1),
  objectKey: z.string().min(1),
});
