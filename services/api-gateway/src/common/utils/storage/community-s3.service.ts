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
import type { UploadedFile } from '../../interfaces/file.interface';
import {
  buildDynamicFolderObjectKey,
  logCommunityS3PutDiagnostics,
  logPresignGenerated,
  resolveUploadContentType,
  withS3PutRetries,
} from './community-s3-helpers';

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
  private s3: S3Client;
  private region: string;
  private readonly bucketName: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
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
        'Missing AWS community S3 env: AWS_S3_REGION_APP_COMM, AWS_S3_ACCESS_KEY_ID_APP_COMM, AWS_S3_SECRET_ACCESS_KEY_APP_COMM',
      );
    }

    const bucketName = trimAwsEnv(process.env.AWS_S3_BUCKET_APP_COMM);
    if (!bucketName) {
      throw new Error('Missing AWS_S3_BUCKET_APP_COMM');
    }

    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.customEndpoint = endpoint;
    this.bucketName = bucketName;
    this.region = region;
    this.s3 = this.createS3Client();
  }

  private createS3Client(): S3Client {
    const clientConfig = {
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
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
    file: UploadedFile,
    folder: 'articles' | 'posts',
    itemId?: string,
  ): Promise<{ location: string; key: string }> {
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

    const bucketName = this.bucketName;
    const objectKey = this.generateObjectKey(
      file.originalname,
      folder,
      itemId,
    );

    const contentType = resolveUploadContentType(
      file.mimetype,
      file.originalname,
    );

    logCommunityS3PutDiagnostics({
      bucket: bucketName,
      region: this.region,
      key: objectKey,
      contentType,
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    });

    const runPut = async () => {
      await withS3PutRetries(() => this.s3.send(command), {
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
          await this.s3.send(new HeadBucketCommand({ Bucket: bucketName }));
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
          `[CommunityS3] S3 region mismatch: retrying with bucket region "${hinted}" (env had "${this.region}"). Set AWS_S3_REGION_APP_COMM=${hinted}.`,
        );
        this.region = hinted;
        this.s3 = this.createS3Client();
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

    const location = `https://${bucketName}.s3.${this.region}.amazonaws.com/${objectKey}`;

    return {
      location,
      key: objectKey,
    };
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
        `Failed to upload multiple files to S3: ${s3ErrorMessage(error)}`,
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
      await this.deleteFile(oldKey);

      return this.uploadFile(file, folder, itemId);
    } catch (error) {
      console.error('Error updating file in S3:', error);
      throw new Error(`Failed to update file in S3: ${s3ErrorMessage(error)}`);
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const bucketName = this.bucketName;

      console.log(`Deleting S3 object: ${key} from bucket: ${bucketName}`);

      const exists = await this.fileExists(key);
      if (!exists) {
        console.log(`S3 object ${key} does not exist, skipping deletion`);
        return true;
      }

      await this.s3.send(
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
   * Generates a presigned `PutObject` URL the browser can upload to directly.
   * Returns `{ url, key, location, expiresIn, contentType }`. `contentType` is canonical
   * (primary type, lowercase); use it on the PUT. S3Client must use `requestChecksumCalculation: 'WHEN_REQUIRED'`
   * so the URL does not embed an empty-body flexible checksum (browser body mismatch).
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
    const bucketName = this.bucketName;
    const { key } = buildDynamicFolderObjectKey(
      input.folder,
      input.originalName,
    );

    const contentType = resolveUploadContentType(
      input.contentType,
      input.originalName,
    );

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const expiresIn = input.expiresInSeconds ?? 60 * 5;
    const url = await getSignedUrl(this.s3, command, { expiresIn });
    logPresignGenerated({
      bucket: bucketName,
      region: this.region,
      key,
      contentType,
      presignedUrl: url,
    });
    // Match the PUT host/path (MinIO / custom endpoint), not a synthetic AWS hostname.
    const put = new URL(url);
    const location = `${put.origin}${put.pathname}`;
    return { url, key, location, expiresIn, contentType };
  }

  async getPresignedGetUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const { blockLegacyGetPresign } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../media/legacy-media-guard') as typeof import('../../media/legacy-media-guard');
    blockLegacyGetPresign('gateway.CommunityS3Service.getPresignedGetUrl');
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3, command, {
        expiresIn: expiresInSeconds,
      });
      return url;
    } catch (error) {
      console.error('Error generating presigned GET URL:', error);
      throw new Error(
        `Failed to generate presigned GET URL: ${s3ErrorMessage(error)}`,
      );
    }
  }

  /** Stream bytes for stable `/api/v1/media/community/...` routes (Range-aware). */
  getObjectStreamForMedia(params: { objectKey: string; range?: string }) {
    return this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: params.objectKey,
        ...(params.range ? { Range: params.range } : {}),
      }),
    );
  }

  private isCommunityAttachmentReadKey(key: string): boolean {
    return (
      key.startsWith('community/messages/') ||
      key.startsWith('community/groups/')
    );
  }

  /**
   * Resolve S3 object key from a stored HTTPS URL (virtual-hosted or path-style)
   * or from a raw key string. Used so browsers never load private objects via unsigned URLs.
   */
  resolveCommunityAttachmentReadKey(urlOrKey: string): string | null {
    const raw = String(urlOrKey ?? '').trim();
    if (!raw) return null;
    if (!raw.startsWith('http')) {
      return this.isCommunityAttachmentReadKey(raw) ? raw : null;
    }
    try {
      const u = new URL(raw);
      let k = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
      if (this.bucketName && k.startsWith(`${this.bucketName}/`)) {
        k = k.slice(this.bucketName.length + 1);
      }
      return this.isCommunityAttachmentReadKey(k) ? k : null;
    } catch {
      return null;
    }
  }

  /** Presigned GET for DM / group uploads (private bucket). */
  async signCommunityAttachmentReadUrl(
    input: { url?: string | null; key?: string | null },
    expiresInSeconds = 3600,
  ): Promise<string | undefined> {
    const fromStoredKey =
      typeof input.key === 'string'
        ? this.resolveCommunityAttachmentReadKey(input.key.trim())
        : null;
    const fromUrl =
      typeof input.url === 'string'
        ? this.resolveCommunityAttachmentReadKey(input.url.trim())
        : null;
    const objectKey = fromStoredKey ?? fromUrl;
    if (!objectKey) return undefined;
    try {
      return await this.getPresignedGetUrl(objectKey, expiresInSeconds);
    } catch (err) {
      console.warn(
        '[CommunityS3] signCommunityAttachmentReadUrl failed',
        s3ErrorMessage(err),
      );
      return undefined;
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
