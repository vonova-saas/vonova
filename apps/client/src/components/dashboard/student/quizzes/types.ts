// Quiz types for Vonova LMS quiz feature

export type QuizType = {
  id: string;
  title: string;
  description: string;
  noOfQuestions: string;
  questions: Question[];
};

export type Question = {
  id: string;
  text: string;
  options: Option[];
  correctOptionId: string;
};

export type Option = {
  id: string;
  text: string;
};

export type QuizResult = {
  quizId: string;
  correctCount: number;
  total: number;
  answers: { questionId: string; selectedOptionId: string }[];
}; 