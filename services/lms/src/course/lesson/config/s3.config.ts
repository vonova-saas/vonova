import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

function trimEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t && t.length > 0 ? t : undefined;
}

@Injectable()
export class S3ConfigService {
  private s3Client: S3Client | null = null;
  private cachedBucket: string | null = null;

  private resolveBucket(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_BUCKET_LMS_AI) ||
      trimEnv(process.env.AWS_S3_BUCKET_LMS) ||
      trimEnv(process.env.AWS_S3_BUCKET) ||
      trimEnv(process.env.S3_BUCKET)
    );
  }

  private resolveRegion(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_REGION) ||
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
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID) ||
      trimEnv(process.env.AWS_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS) ||
      trimEnv(process.env.S3_ACCESS_KEY_ID_LMS_AI) ||
      trimEnv(process.env.AWS_ACCESS_KEY_ID)
    );
  }

  private resolveSecretAccessKey(): string | undefined {
    return (
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY) ||
      trimEnv(process.env.AWS_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS_AI) ||
      trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS) ||
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
        'Lesson S3: set bucket + region + credentials (e.g. AWS_S3_BUCKET_LMS, AWS_S3_REGION_LMS, AWS_S3_ACCESS_KEY_ID_LMS, AWS_S3_SECRET_ACCESS_KEY_LMS, or legacy AWS_S3_BUCKET / AWS_S3_REGION / AWS_S3_ACCESS_KEY_ID / AWS_S3_SECRET_ACCESS_KEY, or standard AWS_* + LMS-AI vars)',
      );
    }

    this.cachedBucket = bucket;
    this.s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    return { client: this.s3Client, bucket: this.cachedBucket };
  }

  getClient(): S3Client {
    return this.ensure().client;
  }

  getBucketName(): string {
    return this.ensure().bucket;
  }
}
