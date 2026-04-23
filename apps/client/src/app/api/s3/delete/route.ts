import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: "Missing required field: key" },
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

    // Delete object from S3
    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
