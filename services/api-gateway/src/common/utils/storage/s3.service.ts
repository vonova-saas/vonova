import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_S3_REGION_LMS!,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID_LMS!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY_LMS!,
      },
    });
  }

  async getPresignedPutUrl(
    objectKey: string,
    contentType: string,
    expiresInSeconds = 180,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_LMS,
        Key: objectKey,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.s3, command, {
        expiresIn: expiresInSeconds,
      });
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  async getPresignedGetUrl(
    objectKey: string,
    expiresInSeconds = 180,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_LMS,
        Key: objectKey,
      });

      const url = await getSignedUrl(this.s3, command, {
        expiresIn: expiresInSeconds,
      });
      return url;
    } catch (error) {
      console.error('Error generating presigned GET URL:', error);
      throw new Error(`Failed to generate presigned GET URL: ${error.message}`);
    }
  }

  async headObjectExists(objectKey: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_LMS,
          Key: objectKey,
        }),
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async uploadFileToLibrary(
    objectKey: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ location: string; key: string }> {
    try {
      const bucketName = process.env.AWS_S3_BUCKET_LMS;
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3.send(command);

      const location = `https://${bucketName}.s3.${process.env.AWS_S3_REGION_LMS}.amazonaws.com/${objectKey}`;

      return {
        location,
        key: objectKey,
      };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
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
      const bucketName = process.env.AWS_S3_BUCKET_LMS;

      console.log(
        `Deleting S3 object: ${objectKey} from bucket: ${bucketName}`,
      );

      // Check if object exists first
      const exists = await this.headObjectExists(objectKey);
      if (!exists) {
        console.log(`S3 object ${objectKey} does not exist, skipping deletion`);
        return true;
      }

      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const result = await this.s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        }),
      );

      console.log(`Successfully deleted S3 object: ${objectKey}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete S3 object ${objectKey}:`, error);
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
