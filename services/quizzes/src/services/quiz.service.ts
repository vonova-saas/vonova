import QuizModel, { Question } from "../models/quiz.model";



export const createQuiz = async (
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



export const updateQuiz = async (
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
    throw new Error("Quiz not found");
  }

  if (userId && quiz.createdBy.toString() !== userId) {
    throw new Error("You are not allowed to update this quiz");
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
