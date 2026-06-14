import { Injectable, Logger } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

function trimAwsEnv(value: string | undefined): string {
  if (value === undefined || value === null) return '';
  let v = String(value).replace(/^\uFEFF/, '').trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/** Auth / app user bucket (profile pictures) — separate from community `APP_COMM`. */
@Injectable()
export class AppAuthS3Service {
  private readonly logger = new Logger(AppAuthS3Service.name);
  private client: S3Client | null = null;
  private bucketName: string | null = null;

  isConfigured(): boolean {
    this.ensureClient();
    return this.client !== null && !!this.bucketName;
  }

  private ensureClient(): void {
    if (this.client) return;
    const region = trimAwsEnv(process.env.AWS_S3_REGION_APP);
    const accessKeyId = trimAwsEnv(process.env.AWS_S3_ACCESS_KEY_ID_APP);
    const secretAccessKey = trimAwsEnv(
      process.env.AWS_S3_SECRET_ACCESS_KEY_APP,
    );
    const bucketName = trimAwsEnv(process.env.AWS_S3_BUCKET_APP);
    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      this.logger.warn(
        'Auth S3 not configured (AWS_S3_REGION_APP / AWS_S3_ACCESS_KEY_ID_APP / AWS_S3_SECRET_ACCESS_KEY_APP / AWS_S3_BUCKET_APP)',
      );
      return;
    }
    this.bucketName = bucketName;
    this.client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  extractKeyFromUrl(url: string): string | null {
    this.ensureClient();
    try {
      const u = new URL(url);
      let key = u.pathname.startsWith('/')
        ? u.pathname.slice(1)
        : u.pathname;
      if (this.bucketName && key.startsWith(`${this.bucketName}/`)) {
        key = key.slice(this.bucketName.length + 1);
      }
      return key || null;
    } catch {
      return null;
    }
  }

  isAuthBucketUrl(url: string): boolean {
    const s = url.trim();
    if (!s.startsWith('http')) return false;
    try {
      const h = new URL(s).hostname.toLowerCase();
      if (h.includes('vonova-auth')) return true;
      const bucket = (this.bucketName ?? trimAwsEnv(process.env.AWS_S3_BUCKET_APP)).toLowerCase();
      if (bucket && h.startsWith(`${bucket}.s3.`)) return true;
      return false;
    } catch {
      return false;
    }
  }

  getObjectStreamForMedia(params: { objectKey: string; range?: string }) {
    this.ensureClient();
    if (!this.client || !this.bucketName) {
      throw new Error('Auth S3 bucket is not configured on the gateway');
    }
    return this.client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: params.objectKey,
        ...(params.range ? { Range: params.range } : {}),
      }),
    );
  }
}
