import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import configuration from '../config/configuration';

export interface InstructorCvUploadInput {
  userId: string;
  buffer: Buffer;
  contentType: string;
  originalName: string;
}

@Injectable()
export class InstructorCvS3Service {
  private getClientAndBucket(): {
    client: S3Client;
    bucket: string;
    region: string;
  } {
    const region = configuration().AWS_S3_REGION_CV_INSTRUCTOR_UPLOADS?.trim();
    const accessKeyId =
      configuration().AWS_S3_ACCESS_KEY_ID_CV_INSTRUCTOR_UPLOADS?.trim();
    const secretAccessKey =
      configuration().AWS_S3_SECRET_ACCESS_KEY_CV_INSTRUCTOR_UPLOADS?.trim();
    const bucket =
      configuration().AWS_S3_BUCKET_CV_INSTRUCTOR_UPLOADS?.trim();

    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'Instructor CV S3 env vars are missing (AWS_S3_REGION_CV_INSTRUCTOR_UPLOADS, AWS_S3_ACCESS_KEY_ID_CV_INSTRUCTOR_UPLOADS, AWS_S3_SECRET_ACCESS_KEY_CV_INSTRUCTOR_UPLOADS, AWS_S3_BUCKET_CV_INSTRUCTOR_UPLOADS)',
      );
    }

    const client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return { client, bucket, region };
  }

  /**
   * Uploads a CV object and returns the public HTTPS URL (virtual-hosted–style).
   */
  async uploadCv(input: InstructorCvUploadInput): Promise<string> {
    const { client, bucket, region } = this.getClientAndBucket();

    const ext = (input.originalName?.split('.').pop() || 'pdf').toLowerCase();
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'pdf';
    const key = `cv/${input.userId}/${uuidv4()}.${safeExt}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.contentType || 'application/octet-stream',
      }),
    );

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
