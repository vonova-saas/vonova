"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

interface AIFeedbackButtonProps {
  courseId: string;
  courseTitle: string;
  studentId: string;
}

interface FeedbackResponse {
  feedback: string;
  rating: number;
  sentiment: "positive" | "neutral" | "negative";
}

export function AIFeedbackButton({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  courseId,
  courseTitle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  studentId,
}: AIFeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeedbackResponse | null>(null);

  async function submitFeedback() {
    if (!feedback.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Send feedback to local API route (which proxies to Hugging Face)
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: feedback,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      // Set the AI feedback result
      setResult({
        feedback: data.feedback || "Thank you for your feedback!",
        rating: data.rating || 0,
        sentiment: data.sentiment || "neutral",
      });

      toast.success("AI feedback received!");
    } catch (error) {
      console.error("Feedback API error:", error);
      toast.error("Failed to get AI feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function closeDialog() {
    setOpen(false);
    setFeedback("");
    setResult(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
          AI Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Course Feedback
          </DialogTitle>
          <DialogDescription>
            Share your thoughts about <strong>{courseTitle}</strong> and get AI-powered insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!result ? (
            <>
              <Textarea
                placeholder="What did you think about this course? What did you like or dislike?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                disabled={loading}
              />
              <Button
                onClick={submitFeedback}
                disabled={loading || !feedback.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Feedback
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      result.sentiment === "positive"
                        ? "bg-green-100 text-green-700"
                        : result.sentiment === "negative"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {result.sentiment.charAt(0).toUpperCase() +
                      result.sentiment.slice(1)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">
                      {result.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.feedback}
                </p>
              </div>
              <Button onClick={closeDialog} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
