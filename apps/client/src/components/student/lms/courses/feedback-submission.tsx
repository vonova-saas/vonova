"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { predictFeedbackSentiment } from "@/services/feedback/feedback.api";
import { FeedbackRequest, FeedbackResponse } from "@/types/api/lms/courses.type";

interface iAppProps {
  onSuccess?: () => void;
}

export function FeedbackSubmission({ onSuccess }: iAppProps) {
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState<FeedbackResponse | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    try {
      setAnalyzing(true);
      const data: FeedbackRequest = { text };
      const result = await predictFeedbackSentiment(data);
      setSentiment(result);
      toast.success("Feedback analyzed successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error analyzing feedback:", error);
      toast.error("Failed to analyze feedback. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = () => {
    if (!sentiment) return null;
    switch (sentiment.sentiment) {
      case "positive":
        return <ThumbsUp className="size-5 text-green-600" />;
      case "negative":
        return <ThumbsDown className="size-5 text-red-600" />;
      case "neutral":
        return <Minus className="size-5 text-gray-600" />;
    }
  };

  const getSentimentColor = () => {
    if (!sentiment) return "";
    switch (sentiment.sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-300";
      case "negative":
        return "bg-red-100 text-red-800 border-red-300";
      case "neutral":
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleSubmit = () => {
    // After sentiment analysis, you might want to submit the feedback to your backend
    // For now, we'll just clear the form
    setText("");
    setSentiment(null);
    toast.success("Thank you for your feedback!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          Course Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="feedback">Your Feedback</Label>
          <Textarea
            id="feedback"
            placeholder="Share your thoughts about this course..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            disabled={analyzing}
          />
        </div>

        {sentiment && (
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-accent/50">
            {getSentimentIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium">Sentiment Analysis</p>
              <Badge className={getSentimentColor()} variant="outline">
                {sentiment.sentiment}
              </Badge>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || !text.trim()}
            className="flex-1"
          >
            {analyzing ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Sentiment"
            )}
          </Button>
          {sentiment && (
            <Button onClick={handleSubmit} variant="outline">
              Submit Feedback
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
