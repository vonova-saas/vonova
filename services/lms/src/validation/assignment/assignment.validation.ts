import { z } from "zod";

// Option Schema
const optionSchema = z.object({
  id: z.string().min(1, "Option ID is required"),
  text: z.string().min(1, "Option text is required"),
});

// Question Schema
const questionSchema = z.object({
  id: z.string().min(1, "Question ID is required"),
  text: z.string().min(1, "Question text is required"),
  options: z.array(optionSchema).min(2, "At least 2 options required"),
  correctOptionId: z.string().min(1, "Correct option ID is required"),
});

// Assignment Schema
export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  topic: z.string().min(1, "Topic is required"),
  noOfQuestions: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Number of questions must be at least 1")
  ),
  questions: z.array(questionSchema).min(1, "At least 1 question is required"),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  topic: z.string().min(1, "Topic is required").optional(),
  noOfQuestions: z.preprocess(
    (val) => (val !== undefined ? Number(val) : undefined),
    z.number().min(1, "Number of questions must be at least 1").optional()
  ),
  questions: z.array(questionSchema).min(1, "At least 1 question is required").optional(),
});

// Submit Answers Schema
export const submitAssignmentAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1, "Question ID is required"),
      selectedOptionId: z.string().min(1, "Selected option ID is required"),
    })
  ).min(1, "At least 1 answer is required"),
});
