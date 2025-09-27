import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Env } from "../../config/env.config";

const s3 = new S3Client({
  region: Env.S3_REGION,
  credentials: {
    accessKeyId: Env.S3_ACCESS_KEY_ID!,
    secretAccessKey: Env.S3_SECRET_ACCESS_KEY!,
  },
});

export const getPresignedPutUrl = async (objectKey: string, contentType: string, expiresInSeconds = Env.S3_PRESIGN_EXPIRES || 180) => {
  const command = new PutObjectCommand({ Bucket: Env.S3_BUCKET, Key: objectKey, ContentType: contentType });
  const url = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  return url;
};

export const getPresignedGetUrl = async (objectKey: string, expiresInSeconds = Env.S3_PRESIGN_EXPIRES || 180) => {
  // We reuse PutObjectCommand's bucket/key with a GET presign by using a no-op Head then replacing method via request presigner is not straightforward.
  // Simpler: construct a signed URL using a GET operation by leveraging GetObject via client-s3 import to avoid extra dependency surface.
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new GetObjectCommand({ Bucket: Env.S3_BUCKET, Key: objectKey });
  const url = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  return url;
};

export const headObjectExists = async (objectKey: string) => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: Env.S3_BUCKET, Key: objectKey }));
    return true;
  } catch (err) {
    return false;
  }
};

export const generateObjectKey = (courseId: string, lessonId: string, fileName: string) => {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `courses/${courseId}/lessons/${lessonId}/${Date.now()}_${sanitized}`;
};
