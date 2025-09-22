import mongoose, { Document, Schema, Types } from "mongoose";

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

export interface AssignmentDocument extends Document {
  title: string;
  description?: string;
  topic: string;
  noOfQuestions: number;
  questions: Question[];
  createdBy: Types.ObjectId;
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

const assignmentSchema = new Schema<AssignmentDocument>(
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = `assignment-${ret._id!.toString().slice(0, 6)}`;
        delete ret._id;
        // delete ret.__v;
        return ret;
      },
    },
  }
);

const AssignmentModel = mongoose.model<AssignmentDocument>("Assignment", assignmentSchema);
export default AssignmentModel;
