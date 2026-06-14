import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { blockLegacyGetPresign } from '../../media/legacy-media-guard';

/**
 * S3 CORS (vonova-lms, eu-north-1): allow GET/HEAD from your web app origin(s),
 * expose ETag / Accept-Ranges as needed, and allow headers used by presigned URLs
 * (e.g. Authorization is not used for presigned GET; browser sends none).
 * Example AllowedOrigins: https://your-app.example
 */

function trimEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t && t.length > 0 ? t : undefined;
}

export type PresignedGetObjectOptions = {
  responseContentDisposition?: string;
  responseContentType?: string;
};

@Injectable()
export class S3Service {
  private s3Client: S3Client | null = null;

  private resolveBucket(): string | undefined {
    return trimEnv(process.env.AWS_S3_BUCKET_LMS);
  }

  private resolveRegion(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_REGION_LMS) ||
      trimEnv(process.env.AWS_REGION) ||
      trimEnv(process.env.AWS_DEFAULT_REGION)
    );
  }

  private resolveAccessKeyId(): string | undefined {
    return trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS);
  }

  private resolveSecretAccessKey(): string | undefined {
    return trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS);
  }

  /** Lazy client: avoids boot failures when S3 env is missing; aligns checksum mode with LMS lesson signing. */
  private ensureClient(): { client: S3Client; bucket: string; region: string } {
    if (this.s3Client) {
      const bucket = this.resolveBucket();
      const region = this.resolveRegion();
      if (!bucket || !region) {
        throw new Error(
          'S3 LMS: set AWS_S3_BUCKET_LMS and AWS_S3_REGION_LMS (e.g. vonova-lms / eu-north-1).',
        );
      }
      return { client: this.s3Client, bucket, region };
    }

    const bucket = this.resolveBucket();
    const region = this.resolveRegion();
    const accessKeyId = this.resolveAccessKeyId();
    const secretAccessKey = this.resolveSecretAccessKey();

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 LMS: set AWS_S3_BUCKET_LMS, AWS_S3_REGION_LMS, AWS_S3_ACCESS_KEY_ID_LMS, AWS_S3_SECRET_ACCESS_KEY_LMS.',
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    return { client: this.s3Client, bucket, region };
  }

  async getPresignedPutUrl(
    objectKey: string,
    contentType: string,
    expiresInSeconds = 180,
  ): Promise<string> {
    try {
      const { client, bucket, region } = this.ensureClient();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: contentType,
      });

      const url = await getSignedUrl(client, command, {
        expiresIn: expiresInSeconds,
      });
      console.log('[S3 LMS PUT PRESIGN]', {
        bucket,
        region,
        objectKey,
        contentType,
        expiresInSeconds,
        ok: true,
      });
      return url;
    } catch (error) {
      console.error('[S3 LMS PUT PRESIGN]', {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getPresignedGetUrl(
    objectKey: string,
    expiresInSeconds = 3600,
    options?: PresignedGetObjectOptions,
  ): Promise<string> {
    blockLegacyGetPresign('gateway.S3Service.getPresignedGetUrl');
    try {
      const { client, bucket, region } = this.ensureClient();
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
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
      console.log('[S3 LMS GET PRESIGN]', {
        bucket,
        region,
        objectKey,
        expiresInSeconds,
        hasDisposition: !!options?.responseContentDisposition,
        responseContentType: options?.responseContentType ?? null,
        signedUrlHost: host,
        ok: true,
      });
      return url;
    } catch (error) {
      console.error('[S3 LMS GET PRESIGN]', {
        ok: false,
        objectKey,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to generate presigned GET URL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async headObjectExists(objectKey: string): Promise<boolean> {
    try {
      const { client, bucket } = this.ensureClient();
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

  /**
   * Authenticated media streaming (no presigned GET): byte pipe from S3 with Range support.
   */
  getObjectStreamForMedia(params: { objectKey: string; range?: string }) {
    const { client, bucket } = this.ensureClient();
    return client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: params.objectKey,
        ...(params.range ? { Range: params.range } : {}),
      }),
    );
  }

  async uploadFileToLibrary(
    objectKey: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ location: string; key: string }> {
    try {
      const { client, bucket, region } = this.ensureClient();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await client.send(command);

      const location = `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;

      console.log('[S3 LMS LIBRARY PUT]', {
        bucket,
        region,
        objectKey,
        contentType,
        bytes: fileBuffer.length,
        ok: true,
      });

      return {
        location,
        key: objectKey,
      };
    } catch (error) {
      console.error('[S3 LMS LIBRARY PUT]', {
        ok: false,
        objectKey,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getPresignedPutUrlForLibrary(
    objectKey: string,
    contentType: string,
    expiresInSeconds = 180,
  ): Promise<string> {
    return this.getPresignedPutUrl(objectKey, contentType, expiresInSeconds);
  }

  async headObjectExistsInLibrary(objectKey: string): Promise<boolean> {
    return this.headObjectExists(objectKey);
  }

  async deleteObject(objectKey: string): Promise<boolean> {
    try {
      const { client, bucket } = this.ensureClient();

      console.log('[S3 LMS DELETE]', { bucket, objectKey });

      const exists = await this.headObjectExists(objectKey);
      if (!exists) {
        console.log(`[S3 LMS DELETE] skip missing key=${objectKey}`);
        return true;
      }

      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        }),
      );

      console.log('[S3 LMS DELETE]', { objectKey, ok: true });
      return true;
    } catch (error) {
      console.error('[S3 LMS DELETE]', {
        objectKey,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  generateLibraryObjectKey(
    itemType: string,
    itemId: string,
    fileName: string,
  ): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `library/${itemType}/${itemId}/${Date.now()}_${sanitized}`;
  }

  generateObjectKey(
    courseId: string,
    lessonId: string,
    fileName: string,
  ): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `courses/${courseId}/lessons/${lessonId}/${Date.now()}_${sanitized}`;
  }
}
