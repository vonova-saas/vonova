// ========== Quiz types for Vonova LMS quiz feature ==========
export type QuizType = {
  _id: string; // backend id
  title: string;
  description: string;
  topic: string;
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

// ========== Quiz API Endpoints ==========
// Quiz Managment for Instructor
export type createQuizType = {
  title: string;
  description: string;
  topic: string;
  noOfQuestions: string;
  questions: Question[];
};

export type createQuizTypeResponse = {
  message: string;
  data: {
    _id: string;
    title: string;
    description: string;
    topic: string;
    noOfQuestions: string;
    questions: Question[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }
}

export type updateQuizType = {
  title: string;
  description?: string;
  topic?: string;
  noOfQuestions?: string;
  questions: Question[];
}

export type updateQuizTypeResponse = {
  message: string;
  data: {
    _id: string;
    title: string;
    description: string;
    topic: string;
    noOfQuestions: string;
    questions: Question[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }
}

export type deleteQuizTypeResponse = {
  message: string;
}

// Quiz View & Submit for Student
export type getAllQuizzesTypeResponse = {
  message: string;
  data: {
    _id: string;
    title: string;
    description: string;
    topic: string;
    noOfQuestions: string;
    questions: Question[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }[],
}

export type getQuizByIdTypeResponse = {
  message: string;
  data: {
    _id: string;
    title: string;
    description: string;
    topic: string;
    noOfQuestions: string;
    questions: Question[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  }
}

export type submitQuizType = {
  answers: {
    questionId: string;
    selectedOptionId: string
  }[];
}

export type submitQuizTypeResponse = {
  message: string;
  data: {
    attemptId: string;
    quizId: string;
    score: number;
    total: number;
    percentage: number;
    answers: {
      questionId: string;
      selectedOptionId: string;
      correct: boolean;
    }[],
  }
}

/** One graded quiz attempt returned by GET student quiz attempts. */
export type StudentQuizAttempt = {
  id: string;
  quiz: string;
  userId: string;
  score: number;
  total: number;
  percentage: number;
  answers: {
    questionId: string;
    selectedOptionId: string;
    correct: boolean;
  }[];
  submittedAt: string;
  gradedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type getAttemptsTypeResponse = {
  message: string;
  data: StudentQuizAttempt[];
};

export type getSpecificAttemptTypeResponse = {
  message: string;
  data: StudentQuizAttempt;
};
