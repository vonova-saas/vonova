import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { UploadedFile } from '../../interfaces/file.interface';

@Injectable()
export class CommunityS3Service {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_S3_REGION_APP_COMM!,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID_APP_COMM!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY_APP_COMM!,
      },
    });
  }

  async uploadFile(
    file: UploadedFile,
    folder: 'articles' | 'posts',
    itemId?: string,
  ): Promise<{ location: string; key: string }> {
    try {
      // Validate file input
      if (!file) {
        throw new Error('No file provided');
      }

      if (!file.buffer) {
        throw new Error('File buffer is missing');
      }

      if (!file.originalname) {
        throw new Error('File originalname is missing');
      }

      // Handle both Buffer and string (base64) cases
      let body: Buffer;
      let contentLength: number;

      if (typeof file.buffer === 'string') {
        // Convert base64 string to Buffer
        body = Buffer.from(file.buffer, 'base64');
        contentLength = body.length;
      } else {
        // Already a Buffer
        body = file.buffer;
        contentLength = file.buffer.length;
      }

      const bucketName = process.env.AWS_S3_BUCKET_APP_COMM!;
      const objectKey = this.generateObjectKey(
        file.originalname,
        folder,
        itemId,
      );

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: body,
        ContentType: file.mimetype || 'application/octet-stream',
        ContentLength: contentLength,
      });

      await this.s3.send(command);

      const location = `https://${bucketName}.s3.${process.env.AWS_S3_REGION_APP_COMM}.amazonaws.com/${objectKey}`;

      return {
        location,
        key: objectKey,
      };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      console.error('File details:', {
        originalname: file?.originalname,
        mimetype: file?.mimetype,
        bufferType: typeof file?.buffer,
        bufferSize: file?.buffer ? Buffer.byteLength(file.buffer) : 0,
        hasBuffer: !!file?.buffer,
      });
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  async uploadMultipleFiles(
    files: UploadedFile[],
    folder: 'articles' | 'posts',
    itemId?: string,
  ): Promise<{ location: string; key: string }[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const uploadPromises = files.map((file) =>
      this.uploadFile(file, folder, itemId),
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple files to S3:', error);
      throw new Error(
        `Failed to upload multiple files to S3: ${error.message}`,
      );
    }
  }

  async updateFile(
    file: UploadedFile,
    oldKey: string,
    folder: 'articles' | 'posts',
    itemId?: string,
  ): Promise<{ location: string; key: string }> {
    try {
      // Delete old file first
      await this.deleteFile(oldKey);

      // Upload new file
      return this.uploadFile(file, folder, itemId);
    } catch (error) {
      console.error('Error updating file in S3:', error);
      throw new Error(`Failed to update file in S3: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const bucketName = process.env.AWS_S3_BUCKET_APP_COMM!;

      console.log(`Deleting S3 object: ${key} from bucket: ${bucketName}`);

      // Check if object exists first
      const exists = await this.fileExists(key);
      if (!exists) {
        console.log(`S3 object ${key} does not exist, skipping deletion`);
        return true;
      }

      const result = await this.s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        }),
      );

      console.log(`Successfully deleted S3 object: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete S3 object ${key}:`, error);
      return false;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_APP_COMM!,
          Key: key,
        }),
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async getPresignedGetUrl(
    key: string,
    expiresInSeconds = 180,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_APP_COMM!,
        Key: key,
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

  private generateObjectKey(
    originalName: string,
    folder: 'articles' | 'posts',
    itemId?: string,
  ): string {
    const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();

    if (folder === 'articles') {
      return `articles/${timestamp}_${sanitized}`;
    } else if (folder === 'posts') {
      if (itemId) {
        return `posts/${itemId}/${timestamp}_${sanitized}`;
      }
      return `posts/${timestamp}_${sanitized}`;
    }

    return `${folder}/${timestamp}_${sanitized}`;
  }

  generateArticleObjectKey(originalName: string): string {
    return this.generateObjectKey(originalName, 'articles');
  }

  generatePostObjectKey(originalName: string, postId: string): string {
    return this.generateObjectKey(originalName, 'posts', postId);
  }

  generateCommentObjectKey(originalName: string, postId: string): string {
    return this.generateObjectKey(originalName, 'posts', postId);
  }
}
