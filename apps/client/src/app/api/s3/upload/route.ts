import { NextResponse } from "next/server";

/**
 * LMS lesson/course media must use the API Gateway presign-put → S3 PUT → confirm flow
 * targeting AWS_S3_BUCKET_LMS only. This Next.js route is disabled.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Video upload must use presigned S3 flow only (API: .../lessons/:lessonId/video/presign-put, then PUT to S3, then .../video/confirm).",
    },
    { status: 410 },
  );
}
