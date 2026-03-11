import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_CHATBOT_API_BASE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json();
  console.log("API RESPONSE:", JSON.stringify(data));

  return NextResponse.json(data);
}