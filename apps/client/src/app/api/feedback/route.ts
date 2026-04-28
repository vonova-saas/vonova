import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

    // Try multiple Hugging Face Space endpoint formats
    const baseUrl = "https://badawi010-vonova-feedback-2.hf.space";
    const endpoints = [
      `${baseUrl}/predict_feedback`,           // Original format
      `${baseUrl}/`,                           // Root endpoint
      `${baseUrl}/api/predict`,                // Gradio API format
      `${baseUrl}/run/predict`,                // Alternative Gradio format
      `${baseUrl}/predict`,                    // Simple predict
    ];

    let lastError = null;
    let response = null;

    for (const apiUrl of endpoints) {
      try {
        console.log(`[Feedback API] Trying endpoint: ${apiUrl}`);
        
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          console.log(`[Feedback API] Success with endpoint: ${apiUrl}`);
          break;
        }
        
        lastError = `${apiUrl}: ${response.status}`;
      } catch (err) {
        lastError = `${apiUrl}: ${err}`;
      }
    }

    if (!response || !response.ok) {
      console.error("[Feedback API] All endpoints failed:", lastError);
      return NextResponse.json(
        { error: `External API error: ${lastError}` },
        { status: 404 }
      );
    }

    const data = await response.json();
    
    // Return the AI feedback response
    return NextResponse.json({
      feedback: data.feedback || data.generated_feedback || data.result || data.text || "Thank you for your feedback!",
      rating: data.rating || data.score || data.confidence || 0,
      sentiment: data.sentiment || data.label || "neutral",
      raw: data, // Include raw data for debugging
    });
  } catch (error) {
    console.error("[Feedback API] Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
