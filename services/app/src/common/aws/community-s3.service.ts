import { Injectable } from '@nestjs/common';
import type { S3ClientConfig } from '@aws-sdk/client-s3';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  buildDynamicFolderObjectKey,
  logCommunityS3PutDiagnostics,
  logPresignGenerated,
  resolveUploadContentType,
  withS3PutRetries,
} from './community-s3-helpers';
import { blockLegacyGetPresign } from '../media/legacy-media-guard';

/** Strip BOM/whitespace and optional matching quotes from .env values (avoids SigV4 mismatches). */
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

function s3ErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** S3 wrong-region / redirect responses often include this header on the error response. */
function extractS3BucketRegionHint(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const o = err as { $response?: { headers?: Record<string, string> } };
  const hdrs = o.$response?.headers;
  if (!hdrs) return undefined;
  const key = Object.keys(hdrs).find(
    (k) => k.toLowerCase() === 'x-amz-bucket-region',
  );
  if (!key) return undefined;
  const v = hdrs[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

@Injectable()
export class CommunityS3Service {
  private s3Client: S3Client;
  private region: string;
  private readonly bucketName: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  /** When set, we talk to S3-compatible storage (MinIO, etc.) — skip AWS region auto-repair. */
  private readonly customEndpoint: string;

  constructor() {
    const region = trimAwsEnv(process.env.AWS_S3_REGION_APP_COMM);
    const accessKeyId = trimAwsEnv(process.env.AWS_S3_ACCESS_KEY_ID_APP_COMM);
    const secretAccessKey = trimAwsEnv(
      process.env.AWS_S3_SECRET_ACCESS_KEY_APP_COMM,
    );
    const endpoint = trimAwsEnv(process.env.AWS_S3_ENDPOINT_APP_COMM);

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing AWS configuration for community. Please check AWS_S3_REGION_APP_COMM, AWS_S3_ACCESS_KEY_ID_APP_COMM, and AWS_S3_SECRET_ACCESS_KEY_APP_COMM environment variables.',
      );
    }

    const bucketName = trimAwsEnv(process.env.AWS_S3_BUCKET_APP_COMM);
    if (!bucketName) {
      throw new Error('Missing AWS_S3_BUCKET_APP_COMM configuration');
    }

    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.customEndpoint = endpoint;
    this.bucketName = bucketName;
    this.region = region;
    this.s3Client = this.createS3Client();
  }

  private createS3Client(): S3Client {
    // Default SDK behaviour adds CRC32 checksum headers on PutObject (SDK ≥3.729),
    // which can trigger SignatureDoesNotMatch with some proxies or signing edge cases.
    // WHEN_REQUIRED keeps SigV4 aligned with classic unsigned-payload PutObject.
    const clientConfig = {
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
      // Required: default SDK embeds empty-body CRC32 in presigned PUT URLs → browser uploads fail.
      requestChecksumCalculation: 'WHEN_REQUIRED' as const,
      responseChecksumValidation: 'WHEN_REQUIRED' as const,
    } as S3ClientConfig;
    if (this.customEndpoint) {
      clientConfig.endpoint = this.customEndpoint;
      clientConfig.forcePathStyle = true;
    }
    return new S3Client(clientConfig);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: 'articles' | 'posts',
    itemId?: string,
    userId?: string,
    commentId?: string,
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.buffer) {
      throw new Error('File buffer is missing');
    }

    if (!file.originalname) {
      throw new Error('File originalname is missing');
    }

    let body: Buffer;

    if (typeof file.buffer === 'string') {
      body = Buffer.from(file.buffer, 'base64');
    } else {
      body = file.buffer;
    }

    const key = this.generateObjectKey(
      file.originalname,
      folder,
      itemId,
      userId,
      commentId,
    );

    const contentType = resolveUploadContentType(
      file.mimetype,
      file.originalname,
    );

    logCommunityS3PutDiagnostics({
      bucket: this.bucketName,
      region: this.region,
      key,
      contentType,
    });

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    const runPut = async () => {
      await withS3PutRetries(() => this.s3Client.send(command), {
        label: 'community-upload',
      });
    };

    try {
      await runPut();
    } catch (firstErr) {
      const msg = s3ErrorMessage(firstErr).toLowerCase();
      let hinted = extractS3BucketRegionHint(firstErr);

      if (
        !this.customEndpoint &&
        !hinted &&
        (msg.includes('signature') || msg.includes('does not match'))
      ) {
        try {
          await this.s3Client.send(
            new HeadBucketCommand({ Bucket: this.bucketName }),
          );
        } catch (headErr) {
          hinted = extractS3BucketRegionHint(headErr);
        }
      }

      if (
        !this.customEndpoint &&
        hinted &&
        hinted !== this.region &&
        (msg.includes('signature') ||
          msg.includes('does not match') ||
          msg.includes('authorization'))
      ) {
        console.warn(
          `[CommunityS3] S3 region mismatch: retrying with bucket region "${hinted}" (env had "${this.region}"). Set AWS_S3_REGION_APP_COMM=${hinted} to skip this probe.`,
        );
        this.region = hinted;
        this.s3Client = this.createS3Client();
        await runPut();
      } else {
        console.error('Error uploading file to S3:', firstErr);
        const buf = file.buffer;
        console.error('File details:', {
          originalname: file?.originalname,
          mimetype: file?.mimetype,
          bufferType: typeof buf,
          bufferSize:
            typeof buf === 'string'
              ? Buffer.byteLength(Buffer.from(buf, 'base64'))
              : buf
                ? Buffer.byteLength(buf)
                : 0,
          hasBuffer: !!buf,
        });
        throw new Error(`Failed to upload file to S3: ${s3ErrorMessage(firstErr)}`);
      }
    }

    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

    return { url, key };
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: 'articles' | 'posts',
    itemId?: string,
  ): Promise<{ url: string; key: string }[]> {
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
      throw new Error(`Failed to upload multiple files to S3: ${s3ErrorMessage(error)}`);
    }
  }

  async updateFile(
    file: Express.Multer.File,
    oldKey: string,
    folder: 'articles' | 'posts',
    itemId?: string,
  ): Promise<{ url: string; key: string }> {
    try {
      await this.deleteFile(oldKey);

      return this.uploadFile(file, folder, itemId);
    } catch (error) {
      console.error('Error updating file in S3:', error);
      throw new Error(`Failed to update file in S3: ${s3ErrorMessage(error)}`);
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      console.log(`Deleting S3 object: ${key} from bucket: ${this.bucketName}`);

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

  /**
   * Presigned PUT for browser/direct uploads (same contract as api-gateway).
   * Returns canonical `contentType` for the client PUT (S3 presign signs `host` only; see AWS SDK v3).
   */
  async getPresignedPutUrl(input: {
    folder: string;
    originalName: string;
    contentType?: string;
    expiresInSeconds?: number;
  }): Promise<{
    url: string;
    key: string;
    location: string;
    expiresIn: number;
    contentType: string;
  }> {
    const { key } = buildDynamicFolderObjectKey(
      input.folder,
      input.originalName,
    );
    const contentType = resolveUploadContentType(
      input.contentType,
      input.originalName,
    );

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const expiresIn = input.expiresInSeconds ?? 60 * 5;
    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    logPresignGenerated({
      bucket: this.bucketName,
      region: this.region,
      key,
      contentType,
      presignedUrl: url,
    });
    const put = new URL(url);
    const location = `${put.origin}${put.pathname}`;
    return { url, key, location, expiresIn, contentType };
  }

  async getSignedUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    blockLegacyGetPresign('communityS3.getSignedUrl');
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
      return url;
    } catch (error) {
      console.error(
        `[MEDIA_SIGN_DEBUG] ${JSON.stringify({
          entityType: 'community_app_s3_get',
          keySample: String(key).slice(0, 160),
          bucket: this.bucketName,
          region: this.region,
          success: false,
          error: s3ErrorMessage(error),
        })}`,
      );
      console.error('Error generating presigned GET URL:', error);
      throw new Error(`Failed to generate presigned GET URL: ${s3ErrorMessage(error)}`);
    }
  }

  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      let key = urlObj.pathname.startsWith('/')
        ? urlObj.pathname.slice(1)
        : urlObj.pathname;
      // Path-style URLs: `/bucket/object-key` → object key only
      const b = this.bucketName;
      if (b && key.startsWith(`${b}/`)) {
        key = key.slice(b.length + 1);
      }
      return key || null;
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
      if (userId && itemId) {
        return `articles/${userId}/${itemId}/${timestamp}_${sanitized}`;
      }
      return `articles/${timestamp}_${sanitized}`;
    } else if (folder === 'posts') {
      if (commentId) {
        if (userId && itemId) {
          return `posts/${userId}/${itemId}/${commentId}/${timestamp}_${sanitized}`;
        }
        return `posts/${itemId}/${commentId}/${timestamp}_${sanitized}`;
      } else {
        if (userId && itemId) {
          return `posts/${userId}/${itemId}/${timestamp}_${sanitized}`;
        }
        return `posts/${itemId}/${timestamp}_${sanitized}`;
      }
    }

    return `${folder}/${timestamp}_${sanitized}`;
  }

  generateArticleObjectKey(
    originalName: string,
    userId: string,
    articleId: string,
  ): string {
    return this.generateObjectKey(originalName, 'articles', articleId, userId);
  }

  generatePostObjectKey(
    originalName: string,
    userId: string,
    postId: string,
  ): string {
    return this.generateObjectKey(originalName, 'posts', postId, userId);
  }

  generateCommentObjectKey(
    originalName: string,
    userId: string,
    postId: string,
    commentId: string,
  ): string {
    return this.generateObjectKey(
      originalName,
      'posts',
      postId,
      userId,
      commentId,
    );
  }

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
