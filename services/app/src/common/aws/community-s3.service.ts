import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class CommunityS3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const region = process.env.AWS_S3_REGION_APP_COMM;
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID_APP_COMM;
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY_APP_COMM;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing AWS configuration for community. Please check AWS_S3_REGION_APP_COMM, AWS_S3_ACCESS_KEY_ID_APP_COMM, and AWS_S3_SECRET_ACCESS_KEY_APP_COMM environment variables.',
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET_APP_COMM;
    if (!bucketName) {
      throw new Error('Missing AWS_S3_BUCKET_APP_COMM configuration');
    }
    this.bucketName = bucketName;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: 'articles' | 'posts',
    itemId?: string,
    userId?: string,
    commentId?: string,
  ): Promise<{ url: string; key: string }> {
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
      
      const key = this.generateObjectKey(file.originalname, folder, itemId, userId, commentId);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: file.mimetype || 'application/octet-stream',
        ContentLength: contentLength,
      });

      await this.s3Client.send(command);
      
      const url = `https://${this.bucketName}.s3.${process.env.AWS_S3_REGION_APP_COMM}.amazonaws.com/${key}`;
      
      return { url, key };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      console.error('File details:', {
        originalname: file?.originalname,
        mimetype: file?.mimetype,
        bufferType: typeof file?.buffer,
        bufferSize: file?.buffer ? 
          Buffer.byteLength(file.buffer) : 0,
        hasBuffer: !!file?.buffer
      });
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: 'articles' | 'posts',
    itemId?: string,
  ): Promise<{ url: string; key: string }[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const uploadPromises = files.map(file => this.uploadFile(file, folder, itemId));
    
    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple files to S3:', error);
      throw new Error(`Failed to upload multiple files to S3: ${error.message}`);
    }
  }

  async updateFile(
    file: Express.Multer.File,
    oldKey: string,
    folder: 'articles' | 'posts',
    itemId?: string,
  ): Promise<{ url: string; key: string }> {
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
      console.log(`Deleting S3 object: ${key} from bucket: ${this.bucketName}`);
      
      // Check if object exists first
      const exists = await this.fileExists(key);
      if (!exists) {
        console.log(`S3 object ${key} does not exist, skipping deletion`);
        return true;
      }
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      
      console.log(`Successfully deleted S3 object: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete S3 object ${key}:`, error);
      return false;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async getSignedUrl(
    key: string,
    expiresInSeconds = 180,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      return url;
    } catch (error) {
      console.error('Error generating presigned GET URL:', error);
      throw new Error(`Failed to generate presigned GET URL: ${error.message}`);
    }
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

  private generateObjectKey(
    originalName: string,
    folder: 'articles' | 'posts',
    itemId?: string,
    userId?: string,
    commentId?: string,
  ): string {
    const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    
    if (folder === 'articles') {
      // Structure: articles/userId/articleId/img
      if (userId && itemId) {
        return `articles/${userId}/${itemId}/${timestamp}_${sanitized}`;
      }
      return `articles/${timestamp}_${sanitized}`;
    } else if (folder === 'posts') {
      if (commentId) {
        // Structure: posts/userId/postId/commentId/img
        if (userId && itemId) {
          return `posts/${userId}/${itemId}/${commentId}/${timestamp}_${sanitized}`;
        }
        return `posts/${itemId}/${commentId}/${timestamp}_${sanitized}`;
      } else {
        // Structure: posts/userId/postId/img
        if (userId && itemId) {
          return `posts/${userId}/${itemId}/${timestamp}_${sanitized}`;
        }
        return `posts/${itemId}/${timestamp}_${sanitized}`;
      }
    }
    
    return `${folder}/${timestamp}_${sanitized}`;
  }

  generateArticleObjectKey(originalName: string, userId: string, articleId: string): string {
    return this.generateObjectKey(originalName, 'articles', articleId, userId);
  }

  generatePostObjectKey(originalName: string, userId: string, postId: string): string {
    return this.generateObjectKey(originalName, 'posts', postId, userId);
  }

  generateCommentObjectKey(originalName: string, userId: string, postId: string, commentId: string): string {
    return this.generateObjectKey(originalName, 'posts', postId, userId, commentId);
  }

  // Legacy methods for backward compatibility
  generateArticleObjectKeyLegacy(originalName: string): string {
    return this.generateObjectKey(originalName, 'articles');
  }

  generatePostObjectKeyLegacy(originalName: string, postId: string): string {
    return this.generateObjectKey(originalName, 'posts', postId);
  }

  generateCommentObjectKeyLegacy(originalName: string, postId: string): string {
    return this.generateObjectKey(originalName, 'posts', postId);
  }
}
