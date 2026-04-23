import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function trimEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t && t.length > 0 ? t : undefined;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client | null = null;
  private resolvedBucket: string | null = null;
  private readonly presignExpiresInSeconds: number;

  constructor() {
    const presignRaw = process.env.AWS_S3_PRESIGN_EXPIRES_LMS_AI;
    const presignParsed = Number.parseInt(presignRaw || '', 10);
    this.presignExpiresInSeconds =
      Number.isFinite(presignParsed) && presignParsed > 0
        ? presignParsed
        : 3600;
  }

  private resolveBucket(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_BUCKET_LMS) ||
      trimEnv(process.env.AWS_S3_BUCKET_LMS) ||
      trimEnv(process.env.AWS_S3_BUCKET_LMS_AI) ||
      trimEnv(process.env.AWS_S3_BUCKET) ||
      trimEnv(process.env.S3_BUCKET)
    );
  }

  private resolveRegion(): string | undefined {
    return (
      trimEnv(process.env.AWS_REGION_LMS_AI) ||
      trimEnv(process.env.AWS_S3_REGION_LMS_AI) ||
      trimEnv(process.env.AWS_S3_REGION_LMS) ||
      trimEnv(process.env.S3_REGION_LMS_AI) ||
      trimEnv(process.env.AWS_REGION) ||
      trimEnv(process.env.AWS_DEFAULT_REGION)
    );
  }

  private resolveAccessKeyId(): string | undefined {
    return (
      trimEnv(process.env.AWS_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS) ||
      trimEnv(process.env.S3_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.AWS_ACCESS_KEY_ID) ||
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID)
    );
  }

  private resolveSecretAccessKey(): string | undefined {
    return (
      trimEnv(process.env.AWS_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS) ||
      trimEnv(process.env.S3_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.AWS_SECRET_ACCESS_KEY) ||
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY)
    );
  }

  /** Builds client on first use so LMS can boot without S3 in local/Docker. */
  private ensureClient(): { client: S3Client; bucket: string } {
    if (this.s3Client && this.resolvedBucket) {
      return { client: this.s3Client, bucket: this.resolvedBucket };
    }

    const bucket = this.resolveBucket();
    if (!bucket) {
      throw new Error(
        'S3 bucket is required for this operation (AWS_S3_BUCKET_LMS_AI, AWS_S3_BUCKET_LMS, AWS_S3_BUCKET, or S3_BUCKET)',
      );
    }

    const region = this.resolveRegion();
    const accessKeyId = this.resolveAccessKeyId();
    const secretAccessKey = this.resolveSecretAccessKey();

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 region and credentials are required for this operation (LMS-AI: AWS_REGION_LMS_AI / AWS_*_LMS_AI; LMS: AWS_S3_REGION_LMS / AWS_S3_ACCESS_KEY_ID_LMS / AWS_S3_SECRET_ACCESS_KEY_LMS; or standard AWS_REGION + AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY)',
      );
    }

    this.resolvedBucket = bucket;
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    return { client: this.s3Client, bucket: this.resolvedBucket };
  }

  async getPresignedPutUrl(
    objectKey: string,
    contentType: string,
    expiresInSeconds = this.presignExpiresInSeconds,
  ): Promise<string> {
    const { client, bucket } = this.ensureClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  async getPresignedGetUrl(
    objectKey: string,
    expiresInSeconds = this.presignExpiresInSeconds,
  ): Promise<string> {
    try {
      const { client, bucket } = this.ensureClient();
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      });
      return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      console.error('Error generating presigned URL:', error);

      // Provide specific guidance for common AWS issues
      if (error instanceof Error) {
        if (error.message.includes('AccessDenied')) {
          throw new Error(
            'AWS Access Denied: Please check AWS credentials and IAM permissions. See AWS-SETUP-INSTRUCTIONS.md for configuration.',
          );
        }
        if (error.message.includes('InvalidAccessKeyId')) {
          throw new Error(
            'AWS Access Key Invalid: Please check AWS_S3_ACCESS_KEY_ID_LMS in your .env file.',
          );
        }
        if (error.message.includes('NoSuchBucket')) {
          throw new Error(
            `S3 Bucket Not Found: Bucket '${this.resolveBucket()}' does not exist. Please check AWS_S3_BUCKET_LMS configuration.`,
          );
        }
      }

      throw new Error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}. Please check AWS credentials and configuration.`,
      );
    }
  }

  async headObjectExists(objectKey: string): Promise<boolean> {
    const { client, bucket } = this.ensureClient();
    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  generateObjectKey(
    courseId: string,
    lessonId: string,
    fileName: string,
  ): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `course/${courseId}/lessons/${lessonId}/${Date.now()}_${sanitized}`;
  }

  generateCourseObjectKey(
    courseId: string,
    lessonId: string,
    fileName: string,
  ): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `course/${courseId}/lessons/${lessonId}/${Date.now()}_${sanitized}`;
  }

  generateLibraryObjectKey(
    itemType: string,
    itemId: string,
    fileName: string,
  ): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `library/${itemType.toLowerCase()}/${itemId}/${Date.now()}_${sanitized}`;
  }

  async uploadFileToLibrary(
    objectKey: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ location: string }> {
    const { client, bucket } = this.ensureClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await client.send(command);
    return { location: `https://${bucket}.s3.amazonaws.com/${objectKey}` };
  }

  async getPresignedPutUrlForLibrary(
    objectKey: string,
    contentType: string,
    expiresInSeconds = this.presignExpiresInSeconds,
  ): Promise<string> {
    const { client, bucket } = this.ensureClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  async headObjectExistsInLibrary(objectKey: string): Promise<boolean> {
    const { client, bucket } = this.ensureClient();
    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
