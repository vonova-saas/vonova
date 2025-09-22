import AssignmentModel, { Question } from "../../models/assignment/assignment.model";
import { ForbiddenException, NotFoundException } from "../../utils/appError";
import AssignmentAnswerModel, { AssignmentAnswerItem } from "../../models/assignment/assignment-answer.model";

export const createAssignmentService = async (
  title: string,
  description: string,
  topic: string,
  noOfQuestions: number,
  questions: Question[],
  createdBy: string
) => {
  const assignment = await AssignmentModel.create({
    title,
    description,
    topic,
    noOfQuestions,
    questions,
    createdBy
  });

  return assignment;
};

export const updateAssignmentService = async (
  assignmentId: string,
  title?: string,
  description?: string,
  topic?: string,
  noOfQuestions?: number,
  updatedQuestions?: Question[],
  userId?: string
) => {
  const assignment = await AssignmentModel.findById(assignmentId);

  if (!assignment) {
    throw new NotFoundException("Assignment not found");
  }

  if (userId && assignment.createdBy.toString() !== userId) {
    throw new ForbiddenException("You are not allowed to update this assignment");
  }

  if (title !== undefined) assignment.title = title;
  if (description !== undefined) assignment.description = description;
  if (topic !== undefined) assignment.topic = topic;
  if (noOfQuestions !== undefined) assignment.noOfQuestions = noOfQuestions;

  if (updatedQuestions && updatedQuestions.length > 0) {
    updatedQuestions.forEach((updatedQ) => {
      const index = assignment.questions.findIndex(q => q.id === updatedQ.id);
      if (index !== -1) {
        assignment.questions[index] = {
          ...assignment.questions[index],
          ...updatedQ
        };
      }
    });
  }

  await assignment.save();
  return assignment;
};

export const getAllAssignmentsService = async () => {
  const assignments = await AssignmentModel.find();
  return assignments;
}

export const getAssignmentByIdService = async (assignmentId: string) => {
  const assignment = await AssignmentModel.findById(assignmentId);
  if (!assignment) {
    throw new NotFoundException("Assignment not found");
  }

  return assignment;
};

export const deleteAssignmentService = async (assignmentId: string, userId: string) => {
  const assignment = await AssignmentModel.findById(assignmentId);
  if (!assignment) {
    throw new NotFoundException("Assignment not found");
  }

  if (assignment.createdBy.toString() !== userId) {
    throw new ForbiddenException("You are not allowed to delete this assignment");
  }

  await assignment.deleteOne();
  return assignment;
}

// ===== Assignment Answers & Grading =====
export const submitAssignmentAnswersService = async (
  assignmentId: string,
  userId: string,
  submitted: Array<{ questionId: string; selectedOptionId: string }>
) => {
  const assignment = await AssignmentModel.findById(assignmentId);
  if (!assignment) {
    throw new NotFoundException("Assignment not found");
  }

  const total = assignment.questions.length;
  const answers: AssignmentAnswerItem[] = [];
  let score = 0;

  const questionMap = new Map<string, Question>();
  assignment.questions.forEach(q => questionMap.set(q.id, q));

  for (const ans of submitted) {
    const q = questionMap.get(ans.questionId);
    if (!q) {
      // Skip unknown question IDs silently; alternatively, throw BadRequest
      continue;
    }
    const correct = q.correctOptionId === ans.selectedOptionId;
    if (correct) score += 1;
    answers.push({ questionId: ans.questionId, selectedOptionId: ans.selectedOptionId, correct });
  }

  const percentage = total > 0 ? Math.round((score / total) * 10000) / 100 : 0;

  const attempt = await AssignmentAnswerModel.create({
    assignment: assignment._id,
    userId,
    answers,
    score,
    total,
    percentage,
  });

  return {
    attemptId: attempt.id,
    assignmentId: assignmentId,
    score,
    total,
    percentage,
    answers,
  };
};

export const getMyAssignmentAttemptService = async (attemptId: string, userId: string) => {
  const attempt = await AssignmentAnswerModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundException("Attempt not found");
  }

  if (attempt.userId.toString() !== userId) {
    throw new ForbiddenException("You are not allowed to view this attempt");
  }

  return attempt;
};

export const getMyAssignmentAttemptsForAssignmentService = async (assignmentId: string, userId: string) => {
  return await AssignmentAnswerModel.find({ assignment: assignmentId, userId }).sort({ createdAt: -1 });
};