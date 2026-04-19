import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CHATBOT_API_BASE}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    // Check if response is OK before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Status:", response.status);
      console.error("API Error Response:", errorText);
      
      return NextResponse.json(
        { 
          error: "Upstream API error", 
          status: response.status, 
          message: errorText || "Unknown error" 
        },
        { status: response.status }
      );
    }

    // Try to parse JSON with error handling
    let data;
    try {
      data = await response.json();
      console.log("API RESPONSE:", JSON.stringify(data));
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      const rawText = await response.text();
      console.error("Raw Response:", rawText);
      
      return NextResponse.json(
        { 
          error: "Invalid JSON response from upstream API", 
          rawResponse: rawText 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Chatbot API Route Error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}