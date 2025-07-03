import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/google/callback";
  const scope = [
    "openid",
    "email",
    "profile"
  ].join(" ");
  const state = Math.random().toString(36).substring(2); // Simple state for demo

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri!,
    response_type: "code",
    scope,
    state,
    access_type: "offline",
    prompt: "consent"
  });

  return NextResponse.redirect(
    "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString(),
    { status: 302 }
  );
} 