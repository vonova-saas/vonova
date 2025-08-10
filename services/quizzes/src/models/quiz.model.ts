import mongoose, { Document, Schema } from "mongoose";

export interface Option {
  id: string; // e.g., "a"
  text: string;
}

export interface Question {
  id: string; // e.g., "q1"
  text: string;
  options: Option[];
  correctOptionId: string;
}

export interface QuizDocument extends Document {
  title: string;
  description?: string;
  topic: string;
  noOfQuestions: number;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<Option>(
  {
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
  },
  { _id: false }
);

const questionSchema = new Schema<Question>(
  {
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    options: {
      type: [optionSchema],
    },
    correctOptionId: {
      type: String,
      required: true
    },
  },
  { _id: false }
);

const quizSchema = new Schema<QuizDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    topic: {
      type: String,
      required: true,
      index: true
    },
    noOfQuestions: {
      type: Number,
      required: true,
      min: 1
    },
    questions: {
      type: [questionSchema],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = `quiz-${ret._id!.toString().slice(0, 6)}`;
        delete ret._id;
        // delete ret.__v;
        return ret;
      },
    },
  }
);

const QuizModel = mongoose.model<QuizDocument>("Quiz", quizSchema);
export default QuizModel;