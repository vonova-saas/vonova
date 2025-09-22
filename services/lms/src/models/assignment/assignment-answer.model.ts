import mongoose, { Document, Schema, Types } from "mongoose";

export interface AssignmentAnswerItem {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
}

export interface AssignmentAnswerDocument extends Document {
  assignment: Types.ObjectId;
  userId: Types.ObjectId;
  answers: AssignmentAnswerItem[];
  score: number;
  total: number;
  percentage: number;
  submittedAt: Date;
  gradedAt: Date;
}

const assignmentAnswerItemSchema = new Schema<AssignmentAnswerItem>(
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

const assignmentAnswerSchema = new Schema<AssignmentAnswerDocument>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
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
      type: [assignmentAnswerItemSchema],
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

const AssignmentAnswerModel = mongoose.model<AssignmentAnswerDocument>("AssignmentAnswer", assignmentAnswerSchema);
export default AssignmentAnswerModel;
