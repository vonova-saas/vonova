import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('env.awsAccessKeyId') ||
      this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('env.awsSecretAccessKey') ||
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.region = this.configService.get<string>('env.awsRegion') ||
      this.configService.get<string>('AWS_REGION') ||
      'eu-north-1';
    this.bucketName = this.configService.get<string>('env.awsS3Bucket') ||
      this.configService.get<string>('AWS_S3_BUCKET') ||
      'cv-pdf-1234567890';

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

    this.logger.log(`S3 Service initialized with bucket: ${this.bucketName}, region: ${this.region}`);
  }

  /**
   * Upload a file to S3
   * @param fileBuffer - The file buffer to upload
   * @param fileName - The original file name
   * @param contentType - The MIME type of the file
   * @param folder - Optional folder path in S3 (e.g., 'pdfs', 'documents')
   * @returns The S3 key (object key) of the uploaded file
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string = 'application/pdf',
    folder?: string
  ): Promise<string> {
    try {
      // Generate a unique key for the file
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileExtension = fileName.split('.').pop() || 'pdf';
      const uniqueFileName = `${timestamp}-${sanitizedFileName}`;

      // Construct the S3 key
      const s3Key = folder
        ? `${folder}/${uniqueFileName}`
        : `pdfs/${uniqueFileName}`;

      this.logger.log(`Uploading file to S3: ${s3Key} (${fileBuffer.length} bytes)`);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          originalFileName: fileName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      this.logger.log(`File uploaded successfully to S3: ${s3Key}`);
      return s3Key;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the S3 URL for a file
   * @param s3Key - The S3 key (object key)
   * @returns The S3 URL
   */
  getFileUrl(s3Key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
  }

  /**
   * Delete a file from S3
   * @param s3Key - The S3 key (object key) to delete
   * @returns True if deletion was successful
   */
  async deleteFile(s3Key: string): Promise<boolean> {
    try {
      if (!s3Key) {
        this.logger.warn('No S3 key provided for deletion');
        return false;
      }

      this.logger.log(`Deleting file from S3: ${s3Key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully from S3: ${s3Key}`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw error, just log it - file might not exist
      return false;
    }
  }

  /**
   * Get the S3 bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }
}

