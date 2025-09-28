import QuizModel, { Question } from "../../models/quizzes/quiz.model";
import { ForbiddenException, NotFoundException } from "../../utils/appError";
import QuizAnswerModel, { QuizAnswerItem } from "../../models/quizzes/quiz-answer.model";

export const createQuizService = async (
  title: string,
  description: string,
  topic: string,
  noOfQuestions: number,
  questions: Question[],
  createdBy: string
) => {
  const quiz = await QuizModel.create({
    title,
    description,
    topic,
    noOfQuestions,
    questions,
    createdBy
  });

  return quiz;
};

export const updateQuizService = async (
  quizId: string,
  title?: string,
  description?: string,
  topic?: string,
  noOfQuestions?: number,
  updatedQuestions?: Question[],
  userId?: string
) => {
  const quiz = await QuizModel.findById(quizId);

  if (!quiz) {
    throw new NotFoundException("Quiz not found");
  }

  if (userId && quiz.createdBy.toString() !== userId) {
    throw new ForbiddenException("You are not allowed to update this quiz");
  }

  if (title !== undefined) quiz.title = title;
  if (description !== undefined) quiz.description = description;
  if (topic !== undefined) quiz.topic = topic;
  if (noOfQuestions !== undefined) quiz.noOfQuestions = noOfQuestions;

  if (updatedQuestions && updatedQuestions.length > 0) {
    updatedQuestions.forEach((updatedQ) => {
      const index = quiz.questions.findIndex(q => q.id === updatedQ.id);
      if (index !== -1) {
        quiz.questions[index] = {
          ...quiz.questions[index],
          ...updatedQ
        };
      }
    });
  }

  await quiz.save();
  return quiz;
};

export const getAllQuizzesService = async () => {
  const quizzes = await QuizModel.find();
  return quizzes;
}

export const getQuizByIdService = async (quizId: string) => {
  const quiz = await QuizModel.findById(quizId);
  if (!quiz) {
    throw new NotFoundException("Quiz not found");
  }

  return quiz;
};

export const deleteQuizService = async (quizId: string, userId: string) => {
  const quiz = await QuizModel.findById(quizId);
  if (!quiz) {
    throw new NotFoundException("Quiz not found");
  }

  if (quiz.createdBy.toString() !== userId) {
    throw new ForbiddenException("You are not allowed to delete this quiz");
  }

  await quiz.deleteOne();
  return "Quiz deleted successfully";
}

// ===== Quiz Answers & Grading =====
export const submitQuizAnswersService = async (
  quizId: string,
  userId: string,
  submitted: Array<{ questionId: string; selectedOptionId: string }>
) => {
  const quiz = await QuizModel.findById(quizId);
  if (!quiz) {
    throw new NotFoundException("Quiz not found");
  }

  const total = quiz.questions.length;
  const answers: QuizAnswerItem[] = [];
  let score = 0;

  const questionMap = new Map<string, Question>();
  quiz.questions.forEach(q => questionMap.set(q.id, q));

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

  const attempt = await QuizAnswerModel.create({
    quiz: quiz._id,
    userId,
    answers,
    score,
    total,
    percentage,
  });

  return {
    attemptId: attempt.id,
    quizId: quizId,
    score,
    total,
    percentage,
    answers,
  };
};

export const getMyQuizAttemptService = async (attemptId: string, userId: string) => {
  const attempt = await QuizAnswerModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundException("Attempt not found");
  }

  if (attempt.userId.toString() !== userId) {
    throw new ForbiddenException("You are not allowed to view this attempt");
  }

  return attempt;
};

export const getMyQuizAttemptsForQuizService = async (quizId: string, userId: string) => {
  return await QuizAnswerModel.find({ quiz: quizId, userId }).sort({ createdAt: -1 });
};