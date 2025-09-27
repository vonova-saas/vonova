import { z } from "zod";

export const libraryProcessingWebhookSchema = z.object({
  itemType: z.enum(["BOOK","GUIDE","PRESENTATION"]),
  itemId: z.string().min(1),
  assetId: z.string().min(1),
  pageCount: z.number().int().min(0).optional(),
  coverUrl: z.string().url().optional(),
  previewThumbnails: z.array(z.string().url()).optional(),
});
