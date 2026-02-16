import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


@Injectable()
export class S3Service {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  async getPresignedPutUrl(objectKey: string, contentType: string, expiresInSeconds = Number(process.env.S3_PRESIGN_EXPIRES) || 180): Promise<string> {
    const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey, ContentType: contentType });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async getPresignedGetUrl(objectKey: string, expiresInSeconds = Number(process.env.S3_PRESIGN_EXPIRES) || 180): Promise<string> {
    const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async headObjectExists(objectKey: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey }));
      return true;
    } catch (err) {
      return false;
    }
  }

  generateObjectKey(courseId: string, lessonId: string, fileName: string): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `courses/${courseId}/lessons/${lessonId}/${Date.now()}_${sanitized}`;
  }
}
