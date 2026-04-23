import axios from "axios";
import { FeedbackRequest, FeedbackResponse } from "@/types/api/lms/courses.type";

const FEEDBACK_API_URL = process.env.NEXT_PUBLIC_FEEDBACK_API_BASE;

// Predict sentiment for feedback text
export const predictFeedbackSentiment = async (
  data: FeedbackRequest
): Promise<FeedbackResponse> => {
  const response = await axios.post(FEEDBACK_API_URL!, data);
  return response.data;
};
