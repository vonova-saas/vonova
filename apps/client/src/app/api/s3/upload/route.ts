import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const COURSES_PREFIX = "courses/";

function getS3Config() {
  const region = process.env.AWS_S3_REGION_APP?.trim();
  const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID_APP?.trim();
  const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY_APP?.trim();
  const bucket = process.env.AWS_S3_BUCKET_APP?.trim();
  
  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }
  
  return { region, accessKeyId, secretAccessKey, bucket };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, contentType, size } = body;

    if (!fileName || !contentType || !size) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, contentType, size" },
        { status: 400 }
      );
    }

    const s3Config = getS3Config();
    if (!s3Config) {
      return NextResponse.json(
        { error: "S3 configuration not found" },
        { status: 500 }
      );
    }

    const s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });

    // Generate unique key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop();
    const key = `${COURSES_PREFIX}${timestamp}-${randomString}.${fileExtension}`;

    // Create command for presigned URL
    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    // Generate presigned URL (expires in 15 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    return NextResponse.json({
      presignedUrl,
      key,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
