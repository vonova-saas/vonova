import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { BadRequestException } from './appError';

type AwsErrorLike = {
  name?: string;
  message?: string;
  $metadata?: { httpStatusCode?: number };
};

function asAwsErrorLike(error: unknown): AwsErrorLike {
  if (typeof error === 'object' && error !== null) return error as AwsErrorLike;
  return {};
}

// Get region and bucket dynamically (not at module load time)
// This ensures environment variables are loaded before we try to use them
function getS3Config() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucket = process.env.AWS_S3_BUCKET;

  // Debug: Log S3 configuration (remove in production)
  if (!bucket) {
    console.warn(
      '[S3] AWS_S3_BUCKET is not set. File uploads will fail. Current env vars:',
      {
        AWS_REGION: process.env.AWS_REGION,
        AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
          ? 'SET'
          : 'NOT SET',
      },
    );
  }

  return { region, bucket };
}

// Create S3 client lazily with dynamic region
function getS3Client() {
  const { region } = getS3Config();
  return new S3Client({
    region,
    // Credentials are resolved from the default provider chain (env vars, IAM role, etc.)
  });
}

export async function uploadCvToS3(file: Express.Multer.File): Promise<string> {
  const { region, bucket } = getS3Config();

  if (!bucket) {
    throw new BadRequestException(
      'File upload is not configured on the server. Please set AWS_S3_BUCKET environment variable.',
    );
  }

  if (!file) {
    throw new BadRequestException('CV file is required.');
  }

  if (file.mimetype !== 'application/pdf') {
    throw new BadRequestException('CV must be a PDF file.');
  }

  const key = `cvs/${Date.now()}-${file.originalname}`;
  const s3Client = getS3Client();

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // NOTE:
        // Many buckets use "Object Ownership = Bucket owner enforced" which DISABLES ACLs.
        // In that case, do NOT set ACL here. Control read access via:
        // - Bucket policy (public/private), or
        // - Presigned GET URLs (recommended for CV privacy)
      }),
    );
  } catch (error: unknown) {
    const awsError = asAwsErrorLike(error);
    // Handle AWS S3 errors with more user-friendly messages
    if (
      awsError.name === 'AccessDenied' ||
      awsError.$metadata?.httpStatusCode === 403
    ) {
      const errorMessage =
        typeof awsError.message === 'string' ? awsError.message : '';
      if (
        errorMessage.includes('PutObjectAcl') ||
        errorMessage.includes('ACL') ||
        errorMessage.includes('does not allow ACLs')
      ) {
        throw new BadRequestException(
          `AWS S3 bucket has ACLs disabled (Bucket owner enforced) or ACL permission is denied. Remove object ACL usage and use a bucket policy or presigned URLs instead. Bucket: ${bucket}`,
        );
      }
      throw new BadRequestException(
        `AWS S3 access denied. The IAM user does not have permission to upload files to the bucket. Please contact your administrator to grant s3:PutObject permission on bucket: ${bucket}`,
      );
    }
    if (
      awsError.name === 'NoSuchBucket' ||
      awsError.$metadata?.httpStatusCode === 404
    ) {
      throw new BadRequestException(
        `AWS S3 bucket not found: ${bucket}. Please verify the bucket name and region configuration.`,
      );
    }
    // Re-throw other errors with original message
    const fallbackMessage =
      typeof awsError.message === 'string'
        ? awsError.message
        : error instanceof Error
          ? error.message
          : 'Unknown error';
    throw new BadRequestException(
      `Failed to upload file to S3: ${fallbackMessage}`,
    );
  }

  const baseUrl =
    process.env.AWS_S3_PUBLIC_URL_PREFIX ||
    `https://${bucket}.s3.${region}.amazonaws.com`;

  return `${baseUrl}/${key}`;
}
