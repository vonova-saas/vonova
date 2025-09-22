import mongoose, { Document, Schema, Types } from "mongoose";

export interface QuizAnswerItem {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
}

export interface QuizAnswerDocument extends Document {
  quiz: Types.ObjectId;
  userId: Types.ObjectId;
  answers: QuizAnswerItem[];
  score: number;
  total: number;
  percentage: number;
  submittedAt: Date;
  gradedAt: Date;
}

const quizAnswerItemSchema = new Schema<QuizAnswerItem>(
  {
    questionId: {
      type: String,
      required: true
    },
    selectedOptionId: {
      type: String,
      required: true
    },
    correct: {
      type: Boolean,
      required: true
    },
  },
  { _id: false }
);

const quizAnswerSchema = new Schema<QuizAnswerDocument>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    answers: {
      type: [quizAnswerItemSchema],
      default: []
    },
    score: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    gradedAt: {
      type: Date,
      default: Date.now
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id?.toString();
        if (ret && (ret as any)._id !== undefined) {
          delete (ret as any)._id;
        }
        return ret;
      },
    },
  }
);

const QuizAnswerModel = mongoose.model<QuizAnswerDocument>("QuizAnswer", quizAnswerSchema);
export default QuizAnswerModel;
