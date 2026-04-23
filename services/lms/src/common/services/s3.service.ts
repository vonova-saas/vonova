import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3 service for direct upload/delete (e.g. LMS-AI PDF summary).
 * For presigned URLs (library/course), use common/utils/storage/s3.service.
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>(
      'AWS_ACCESS_KEY_ID_LMS_AI',
    );
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY_LMS_AI',
    );
    this.region = this.configService.get<string>('AWS_REGION_LMS_AI') ?? '';
    this.bucketName =
      this.configService.get<string>('AWS_S3_BUCKET_LMS') ??
      this.configService.get<string>('AWS_S3_BUCKET_LMS_AI') ??
      '';

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('AWS credentials not configured. S3 uploads will fail.');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });

    this.logger.log(
      `S3 Service initialized with bucket: ${this.bucketName}, region: ${this.region}`,
    );
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string = 'application/pdf',
    folder?: string,
    bucketName?: string,
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
      const s3Key = folder
        ? `${folder}/${uniqueFileName}`
        : `pdfs/${uniqueFileName}`;

      const targetBucket = bucketName || this.bucketName;

      this.logger.log(
        `Uploading file to S3: ${s3Key} (${fileBuffer.length} bytes) to bucket: ${targetBucket}`,
      );

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: targetBucket,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: contentType,
          Metadata: {
            originalFileName: fileName,
            uploadedAt: new Date().toISOString(),
          },
        }),
      );

      this.logger.log(`File uploaded successfully to S3: ${s3Key}`);
      return s3Key;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uploading file to S3: ${msg}`);
      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${msg}`,
      );
    }
  }

  getFileUrl(s3Key: string, bucketName?: string): string {
    const targetBucket = bucketName || this.bucketName;
    return `https://${targetBucket}.s3.${this.region}.amazonaws.com/${s3Key}`;
  }

  async getPresignedGetUrl(
    s3Key: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    const defaultExpires = (() => {
      const raw = this.configService.get<string>(
        'AWS_S3_PRESIGN_EXPIRES_LMS_AI',
      );
      const parsed = raw ? Number(raw) : NaN;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
    })();
    const expires =
      typeof expiresInSeconds === 'number' && expiresInSeconds > 0
        ? expiresInSeconds
        : defaultExpires;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });
    return getSignedUrl(this.s3Client, command, {
      expiresIn: expires,
    });
  }

  async deleteFile(s3Key: string, bucketName?: string): Promise<boolean> {
    try {
      if (!s3Key) {
        this.logger.warn('No S3 key provided for deletion');
        return false;
      }
      const targetBucket = bucketName || this.bucketName;
      this.logger.log(
        `Deleting file from S3: ${s3Key} from bucket: ${targetBucket}`,
      );
      await this.s3Client.send(
        new DeleteObjectCommand({ Bucket: targetBucket, Key: s3Key }),
      );
      this.logger.log(`File deleted successfully from S3: ${s3Key}`);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting file from S3: ${msg}`);
      return false;
    }
  }

  getBucketName(): string {
    return this.bucketName;
  }
}
