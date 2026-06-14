import { Injectable, BadRequestException } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { tryValidateLmsObjectKeyForPresign } from '../../../common/media/lms-presign-key.validator';
import { blockLegacyGetPresign } from '../../../common/media/legacy-media-guard';

function trimEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t && t.length > 0 ? t : undefined;
}

@Injectable()
export class S3ConfigService {
  private s3Client: S3Client | null = null;
  private cachedBucket: string | null = null;

  /** Lesson video pipeline must use the LMS content bucket only. */
  private resolveBucket(): string | undefined {
    return trimEnv(process.env.AWS_S3_BUCKET_LMS);
  }

  private resolveRegion(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_REGION_LMS) ||
      trimEnv(process.env.AWS_S3_REGION) ||
      trimEnv(process.env.AWS_REGION_LMS_AI) ||
      trimEnv(process.env.AWS_S3_REGION_LMS_AI) ||
      trimEnv(process.env.S3_REGION_LMS_AI) ||
      trimEnv(process.env.AWS_REGION) ||
      trimEnv(process.env.AWS_DEFAULT_REGION)
    );
  }

  private resolveAccessKeyId(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS) ||
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID) ||
      trimEnv(process.env.AWS_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.S3_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.AWS_ACCESS_KEY_ID)
    );
  }

  private resolveSecretAccessKey(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS) ||
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY) ||
      trimEnv(process.env.AWS_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.S3_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.AWS_SECRET_ACCESS_KEY)
    );
  }

  /** Lazy so LMS can boot; lesson S3 routes fail until configured. */
  private ensure(): { client: S3Client; bucket: string } {
    if (this.s3Client && this.cachedBucket) {
      return { client: this.s3Client, bucket: this.cachedBucket };
    }

    const bucket = this.resolveBucket();
    const region = this.resolveRegion();
    const accessKeyId = this.resolveAccessKeyId();
    const secretAccessKey = this.resolveSecretAccessKey();

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Lesson S3: set AWS_S3_BUCKET_LMS, AWS_S3_REGION_LMS, AWS_S3_ACCESS_KEY_ID_LMS, AWS_S3_SECRET_ACCESS_KEY_LMS (LMS bucket only — no app/AI bucket fallback).',
      );
    }

    this.cachedBucket = bucket;
    // Presigned GET in <video src> + Range requests: default SDK checksum mode adds
    // x-amz-checksum-mode to the URL and can break browser playback / DevTools.
    this.s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
    return { client: this.s3Client, bucket: this.cachedBucket };
  }

  getClient(): S3Client {
    return this.ensure().client;
  }

  getBucketName(): string {
    return this.ensure().bucket;
  }

  /** Presigned GET for objects in AWS_S3_BUCKET_LMS (same bucket as lesson video PUT). */
  async getPresignedGetUrl(
    objectKey: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    blockLegacyGetPresign('lesson.S3ConfigService.getPresignedGetUrl');
    const { client, bucket } = this.ensure();
    const v = tryValidateLmsObjectKeyForPresign(objectKey);
    if (!v.ok) {
      console.warn(
        `[MEDIA_SIGN_DEBUG] ${JSON.stringify({
          entityType: 'lms_s3_config_get',
          keySample: String(objectKey).slice(0, 160),
          bucket,
          region: this.resolveRegion() ?? null,
          success: false,
          failureReason: v.reason,
        })}`,
      );
      console.warn('[LMS_PRESIGN_KEY_REJECTED]', {
        op: 'lesson_get',
        reason: v.reason,
        keySample: String(objectKey).slice(0, 160),
      });
      throw new BadRequestException(`Invalid S3 object key: ${v.reason}`);
    }
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: v.key,
    });
    const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    let host: string | undefined;
    try {
      host = new URL(url).hostname;
    } catch {
      host = undefined;
    }
    console.log('[LESSON_VIDEO_STREAM]', {
      bucket,
      region: this.resolveRegion() ?? null,
      objectKey: v.key,
      expiresInSeconds,
      signedUrlHost: host,
      ok: true,
    });
    return url;
  }
}
