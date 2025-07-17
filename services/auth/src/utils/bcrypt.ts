import bcrypt from "bcrypt";
import { createHash } from "crypto";

export const hashValue = async (value: string, saltRounds: number = 10) =>
  await bcrypt.hash(value, saltRounds);

export const compareValue = async (value: string, hashedValue: string) =>
  await bcrypt.compare(value, hashedValue);

export const generateDeviceHash = (userAgent: string): string => {
  if (userAgent.includes("PostmanRuntime")) {
    return createHash("sha256").update("postman").digest("hex");
  }
  return createHash("sha265").update(userAgent).digest("hex");
};
