import { z } from "zod";

// Option Schema
const optionSchema = z.object({
  id: z.string().min(1, "Option ID is required"), // e.g., "a"
  text: z.string().min(1, "Option text is required"),
});

// Question Schema
const questionSchema = z.object({
  id: z.string().min(1, "Question ID is required"), // e.g., "q1"
  text: z.string().min(1, "Question text is required"),
  options: z.array(optionSchema)
    .min(2, "Each question must have at least two options"),
  correctOptionId: z.string().min(1, "Correct option ID is required"),
});

// Create Quiz Validation
export const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  topic: z.string().min(1, "Topic is required"),
  noOfQuestions: z.number()
    .min(1, "There must be at least one question"),
  questions: z.array(questionSchema)
    .min(1, "Quiz must have at least one question"),
}).refine(
  (data) => data.noOfQuestions === data.questions.length,
  {
    message: "Number of questions must match 'noOfQuestions'",
    path: ["noOfQuestions"],
  }
);
