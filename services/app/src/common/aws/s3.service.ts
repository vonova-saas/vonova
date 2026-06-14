import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { blockLegacyGetPresign } from '../media/legacy-media-guard';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const region = process.env.AWS_S3_REGION_APP;
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID_APP;
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY_APP;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing AWS configuration. Please check AWS_S3_REGION_APP, AWS_S3_ACCESS_KEY_ID_APP, and AWS_S3_SECRET_ACCESS_KEY_APP environment variables.',
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET_APP;
    if (!bucketName) {
      throw new Error('Missing AWS_S3_BUCKET_APP configuration');
    }
    this.bucketName = bucketName;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<{ url: string; key: string }> {
    const key = `${folder}/${uuidv4()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    // Generate presigned URL for the uploaded file
    const url = await this.getSignedUrl(key, 3600); // 1 hour expiry

    return { url, key };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    blockLegacyGetPresign('app.S3Service.getSignedUrl');
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client as never, command as never, { expiresIn });
  }

  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.startsWith('/') ? pathname.substring(1) : pathname;
    } catch {
      return null;
    }
  }

  /**
   * Virtual-hosted–style URL: `{bucket}.s3.{region}.amazonaws.com/{key}`.
   */
  extractBucketAndKeyFromVirtualHostedUrl(
    url: string,
  ): { bucket: string; key: string } | null {
    try {
      const u = new URL(url);
      const host = u.hostname;
      const lower = host.toLowerCase();
      const dotS3 = lower.indexOf('.s3');
      if (dotS3 <= 0) return null;
      if (!lower.endsWith('.amazonaws.com')) return null;
      const bucket = host.slice(0, dotS3);
      const raw = u.pathname.replace(/^\//, '');
      const key = decodeURIComponent(raw);
      if (!bucket || !key) return null;
      return { bucket, key };
    } catch {
      return null;
    }
  }

  async getSignedUrlForBucketAndKey(
    bucket: string,
    key: string,
    expiresIn = 300,
  ): Promise<string> {
    blockLegacyGetPresign('app.S3Service.getSignedUrlForBucketAndKey');
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return await getSignedUrl(this.s3Client as never, command as never, {
      expiresIn,
    });
  }

  /** Presign GET for profile-style keys under any bucket referenced by the URL. */
  async signProfileMediaReadUrl(
    url: string | null | undefined,
    expiresIn = 300,
  ): Promise<string | undefined> {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return undefined;
    }
    const parsed = this.extractBucketAndKeyFromVirtualHostedUrl(url);
    if (!parsed) return undefined;
    const { bucket, key } = parsed;
    if (!key.startsWith('avatars/') && !key.startsWith('covers/')) {
      return undefined;
    }
    try {
      return await this.getSignedUrlForBucketAndKey(bucket, key, expiresIn);
    } catch {
      return undefined;
    }
  }
}
