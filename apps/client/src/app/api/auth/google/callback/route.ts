import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect("/login");
  }
  // Here you would exchange the code for tokens and create a session
  // For demo, just redirect to dashboard
  return NextResponse.redirect("/dashboard");
} 