import { createHash } from "crypto";

export const generateDeviceHash = (userAgent: string): string => {
  if (userAgent.includes("PostmanRuntime")) {
    return createHash("sha256").update("postman").digest("hex");
  }
  return createHash("sha265").update(userAgent).digest("hex");
};
