import { Injectable, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { normalizeLmsS3ObjectKey } from '../s3-key.util';
import { tryValidateLmsObjectKeyForPresign } from '../../media/lms-presign-key.validator';
import { blockLegacyGetPresign } from '../../media/legacy-media-guard';

export type PresignedGetObjectOptions = {
  responseContentDisposition?: string;
  responseContentType?: string;
};

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
      trimEnv(process.env.AWS_S3_BUCKET_LMS_AI) ||
      trimEnv(process.env.AWS_S3_BUCKET) ||
      trimEnv(process.env.S3_BUCKET)
    );
  }

  private resolveRegion(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_REGION_LMS) ||
      trimEnv(process.env.AWS_REGION) ||
      trimEnv(process.env.AWS_DEFAULT_REGION) ||
      trimEnv(process.env.AWS_REGION_LMS_AI) ||
      trimEnv(process.env.AWS_S3_REGION_LMS_AI) ||
      trimEnv(process.env.S3_REGION_LMS_AI)
    );
  }

  /**
   * Prefer LMS bucket IAM user before LMS-AI / PDF-summary credentials.
   * Otherwise deletes (e.g. course thumbnails) may use an AI-only user that
   * has Put/Get but not s3:DeleteObject on AWS_S3_BUCKET_LMS.
   */
  private resolveAccessKeyId(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS) ||
      trimEnv(process.env.AWS_ACCESS_KEY_ID) ||
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID) ||
      trimEnv(process.env.AWS_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.S3_ACCESS_KEY_ID_LMS_AI)
    );
  }

  private resolveSecretAccessKey(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS) ||
      trimEnv(process.env.AWS_SECRET_ACCESS_KEY) ||
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY) ||
      trimEnv(process.env.AWS_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.S3_SECRET_ACCESS_KEY_LMS_AI)
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
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    return { client: this.s3Client, bucket: this.resolvedBucket };
  }

  async getPresignedPutUrl(
    objectKey: string,
    contentType: string,
    expiresInSeconds = this.presignExpiresInSeconds,
  ): Promise<string> {
    const { client, bucket } = this.ensureClient();
    const v = tryValidateLmsObjectKeyForPresign(objectKey);
    if (!v.ok) {
      console.warn('[LMS_PRESIGN_KEY_REJECTED]', {
        op: 'put',
        reason: v.reason,
        keySample: String(objectKey).slice(0, 160),
      });
      throw new BadRequestException(`Invalid S3 object key: ${v.reason}`);
    }
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: v.key,
      ContentType: contentType,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  async getPresignedGetUrl(
    objectKey: string,
    expiresInSeconds = this.presignExpiresInSeconds,
    options?: PresignedGetObjectOptions,
  ): Promise<string> {
    blockLegacyGetPresign('lms.S3Service.getPresignedGetUrl');
    try {
      const { client, bucket } = this.ensureClient();
      const region = this.resolveRegion();
      const v = tryValidateLmsObjectKeyForPresign(objectKey);
      if (!v.ok) {
        console.warn('[LMS_PRESIGN_KEY_REJECTED]', {
          op: 'get',
          reason: v.reason,
          keySample: String(objectKey).slice(0, 160),
        });
        throw new BadRequestException(`Invalid S3 object key: ${v.reason}`);
      }
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: v.key,
        ...(options?.responseContentDisposition
          ? {
              ResponseContentDisposition: options.responseContentDisposition,
            }
          : {}),
        ...(options?.responseContentType
          ? { ResponseContentType: options.responseContentType }
          : {}),
      });
      const url = await getSignedUrl(client, command, {
        expiresIn: expiresInSeconds,
      });
      let host: string | undefined;
      try {
        host = new URL(url).hostname;
      } catch {
        host = undefined;
      }
      console.log('[LMS S3 GET PRESIGN]', {
        bucket,
        region: region ?? null,
        objectKey: v.key,
        expiresInSeconds,
        hasDisposition: !!options?.responseContentDisposition,
        mimeHint: options?.responseContentType ?? null,
        signedUrlHost: host,
        ok: true,
      });
      return url;
    } catch (error) {
      console.error('[LMS S3 GET PRESIGN]', {
        objectKey: String(objectKey).slice(0, 200),
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });

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
    const v = tryValidateLmsObjectKeyForPresign(objectKey);
    if (!v.ok) {
      console.warn('[LMS_PRESIGN_KEY_REJECTED]', {
        op: 'put_library',
        reason: v.reason,
        keySample: String(objectKey).slice(0, 160),
      });
      throw new BadRequestException(`Invalid S3 object key: ${v.reason}`);
    }
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: v.key,
      ContentType: contentType,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  async headObjectExistsInLibrary(objectKey: string): Promise<boolean> {
    const key = normalizeLmsS3ObjectKey(objectKey);
    const { client, bucket } = this.ensureClient();
    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /** Delete one object from the configured LMS bucket (idempotent). */
  async deleteFileFromS3(objectKey: string): Promise<boolean> {
    if (!objectKey?.trim()) {
      console.log('[S3 DELETE]', { key: objectKey, success: false, reason: 'empty_key' });
      return false;
    }
    try {
      const { client, bucket } = this.ensureClient();
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: objectKey.trim() }),
      );
      console.log('[S3 DELETE]', { key: objectKey, success: true });
      return true;
    } catch (err) {
      console.log('[S3 DELETE]', {
        key: objectKey,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }
}
