import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { resolveS3ObjectKeyForDelete } from "@/lib/lms/presigned-url";

type S3Env = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

function trimEnv(value: string | undefined): string {
  return (value ?? "").trim();
}

function lmsS3Env(): S3Env | null {
  const region = trimEnv(process.env.AWS_S3_REGION_LMS);
  const accessKeyId = trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_LMS);
  const secretAccessKey = trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_LMS);
  const bucket = trimEnv(process.env.AWS_S3_BUCKET_LMS);
  if (!region || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { region, accessKeyId, secretAccessKey, bucket };
}

function appS3Env(): S3Env | null {
  const region = trimEnv(process.env.AWS_S3_REGION_APP);
  const accessKeyId = trimEnv(process.env.AWS_S3_ACCESS_KEY_ID_APP);
  const secretAccessKey = trimEnv(process.env.AWS_S3_SECRET_ACCESS_KEY_APP);
  const bucket = trimEnv(process.env.AWS_S3_BUCKET_APP);
  if (!region || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { region, accessKeyId, secretAccessKey, bucket };
}

function resolveDeleteTarget(rawKey: string): {
  env: S3Env;
  objectKey: string;
} | null {
  const objectKey = resolveS3ObjectKeyForDelete(rawKey);
  if (!objectKey) return null;
  const lmsPrefixes = ["course/", "courses/", "library/", "posts/", "lessons/"];
  const useLms = lmsPrefixes.some((p) => objectKey.startsWith(p));
  const env = useLms ? lmsS3Env() : appS3Env();
  if (!env) return null;
  return { env, objectKey };
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { key } = body as { key?: string };

    if (!key) {
      return NextResponse.json(
        { error: "Missing required field: key" },
        { status: 400 },
      );
    }

    const target = resolveDeleteTarget(key);
    if (!target) {
      return NextResponse.json(
        {
          error:
            "Not an S3 object key (stable media URLs cannot be deleted via this route)",
        },
        { status: 400 },
      );
    }

    const s3Client = new S3Client({
      region: target.env.region,
      credentials: {
        accessKeyId: target.env.accessKeyId,
        secretAccessKey: target.env.secretAccessKey,
      },
    });

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: target.env.bucket,
        Key: target.objectKey,
      }),
    );

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
