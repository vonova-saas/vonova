import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz } from './schema/quiz.schema';
import { QuizAnswer } from './schema/quiz-answer.schema';
import {
  CreateQuizDto,
  QuestionDto,
  SubmitAnswerItemDto,
  UpdateQuizDto,
} from './dto/quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(QuizAnswer.name) private answerModel: Model<QuizAnswer>,
  ) {}

  
  // ===== INSTRUCTOR-SPECIFIC METHODS =====

  async createInstructorQuiz(dto: CreateQuizDto, userId: string) {
    const quiz = await this.quizModel.create({ ...dto, createdBy: userId });
    return quiz;
  }

  async updateInstructorQuiz(quizId: string, dto: UpdateQuizDto, userId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Ensure user can update this quiz
    if (quiz.createdBy.toString() !== userId) {
      throw new NotFoundException('Quiz not found or access denied');
    }

    if (dto.title) quiz.title = dto.title;
    if (dto.description) quiz.description = dto.description;
    if (dto.topic) quiz.topic = dto.topic;
    if (dto.noOfQuestions) quiz.noOfQuestions = dto.noOfQuestions;

    if (dto.questions) {
      dto.questions.forEach((updatedQ: QuestionDto) => {
        const index = quiz.questions.findIndex((q) => q.id === updatedQ.id);
        if (index !== -1) {
          quiz.questions[index] = { ...quiz.questions[index], ...updatedQ };
        } else {
          quiz.questions.push(updatedQ);
        }
      });
    }

    await quiz.save();
    return quiz;
  }

  async getInstructorQuizzes(userId: string) {
    return this.quizModel.find({ createdBy: userId }).sort({ createdAt: -1 });
  }

  async getInstructorQuizById(quizId: string, userId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Ensure user can access this quiz
    if (quiz.createdBy.toString() !== userId) {
      throw new NotFoundException('Quiz not found or access denied');
    }

    return quiz;
  }

  async deleteInstructorQuiz(quizId: string, userId: string) {
    const quiz = await this.quizModel.findOne({
      _id: quizId,
      createdBy: userId,
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    await quiz.deleteOne();
    return { message: 'Quiz deleted successfully' };
  }

  async getInstructorQuizAttempts(quizId: string, userId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Ensure user can access this quiz
    if (quiz.createdBy.toString() !== userId) {
      throw new NotFoundException('Quiz not found or access denied');
    }

    return this.answerModel
      .find({ quiz: quizId })
      .sort({ createdAt: -1 });
  }

  async getInstructorQuizStatistics(quizId: string, userId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Ensure user can access this quiz
    if (quiz.createdBy.toString() !== userId) {
      throw new NotFoundException('Quiz not found or access denied');
    }

    const attempts = await this.answerModel.find({ quiz: quizId });
    const totalAttempts = attempts.length;
    
    if (totalAttempts === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        completionRate: 0,
      };
    }

    const scores = attempts.map(attempt => attempt.percentage);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const passRate = (attempts.filter(attempt => attempt.percentage >= 70).length / totalAttempts) * 100;

    return {
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      passRate: Math.round(passRate * 100) / 100,
      completionRate: 100, // All submissions are complete
    };
  }

  // ===== STUDENT-SPECIFIC METHODS =====

  async getAvailableQuizzesForStudents() {
    // Return quizzes without correct answers
    const quizzes = await this.quizModel.find().select('-questions.correctOptionId');
    return quizzes;
  }

  async getQuizForStudent(quizId: string, userId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Check if student has already attempted this quiz
    const existingAttempt = await this.answerModel.findOne({ quiz: quizId, userId });

    // If student hasn't attempted, return quiz without correct answers
    if (!existingAttempt) {
      const quizObj = quiz.toObject();
      // Remove correct answers from questions
      const quizWithoutAnswers = {
        ...quizObj,
        questions: quizObj.questions.map(q => {
          const { correctOptionId, ...questionWithoutAnswer } = q;
          return questionWithoutAnswer;
        })
      };
      return {
        ...quizWithoutAnswers,
        alreadyAttempted: false,
        attemptId: null,
      };
    }

    // If student has attempted, return quiz with their answers and correct answers for review
    const quizObj = quiz.toObject();
    const attemptObj = existingAttempt.toObject();

    // Map student's answers to questions
    const questionsWithAnswers = quizObj.questions.map(question => {
      const studentAnswer = attemptObj.answers.find(ans => ans.questionId === question.id);
      return {
        ...question,
        studentSelectedOptionId: studentAnswer?.selectedOptionId || null,
        isCorrect: studentAnswer?.correct || false,
      };
    });

    return {
      ...quizObj,
      questions: questionsWithAnswers,
      alreadyAttempted: true,
      attemptId: existingAttempt._id,
      attempt: {
        score: attemptObj.score,
        total: attemptObj.total,
        percentage: attemptObj.percentage,
        submittedAt: attemptObj.submittedAt,
      }
    };
  }

  async submitStudentQuiz(quizId: string, answers: SubmitAnswerItemDto[], userId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Check if student has already attempted this quiz
    const existingAttempt = await this.answerModel.findOne({ quiz: quizId, userId });
    if (existingAttempt) {
      throw new Error('You have already attempted this quiz. Only one attempt is allowed.');
    }

    const total = quiz.questions.length;
    let score = 0;
    const formatted: {
      questionId: string;
      selectedOptionId: string | null;
      correct: boolean;
    }[] = [];

    // Process all questions with student answers and correct info
    const questionsWithResults = quiz.questions.map(question => {
      const studentAnswer = answers.find(ans => ans.questionId === question.id);
      const selectedOptionId = studentAnswer?.selectedOptionId || null;
      
      // Only count as correct if answered and matches
      const correct = selectedOptionId !== null && question.correctOptionId === selectedOptionId;
      if (correct) score++;

      // Add all questions to formatted answers (including unanswered)
      formatted.push({
        questionId: question.id,
        selectedOptionId,
        correct,
      });

      // Return question with result info
      const questionResult: any = {
        questionId: question.id,
        questionText: question.text,
        options: question.options,
        studentSelectedOptionId: selectedOptionId,
        correct,
      };

      // If answer is wrong, add correct answer info
      if (!correct && selectedOptionId) {
        const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
        questionResult.correctOptionId = question.correctOptionId;
        questionResult.correctOptionText = correctOption?.text || '';
      }

      return questionResult;
    });

    const percentage = total ? Math.round((score / total) * 10000) / 100 : 0;

    const attempt = await this.answerModel.create({
      quiz: quiz._id,
      userId,
      answers: formatted,
      score,
      total,
      percentage,
    });

    // Return attempt with all questions and results
    return {
      ...attempt.toObject(),
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        topic: quiz.topic,
        noOfQuestions: quiz.noOfQuestions,
        questions: questionsWithResults,
      },
      submittedAt: attempt.submittedAt,
    };
  }

  async getStudentAttempt(attemptId: string, userId: string) {
    const attempt = await this.answerModel.findById(attemptId);
    if (!attempt) throw new NotFoundException('Attempt not found');

    // Ensure user can only access their own attempts
    if (attempt.userId.toString() !== userId) {
      throw new NotFoundException('Attempt not found or access denied');
    }

    return attempt;
  }

  async getStudentQuizAttempts(userId: string) {
    const attempts = await this.answerModel
      .find({ userId })
      .populate('quiz', 'title description topic noOfQuestions createdAt questions')
      .sort({ createdAt: -1 });

    // Enhance attempts with correct answers for incorrect responses
    const enhancedAttempts = await Promise.all(
      attempts.map(async (attempt) => {
        const quiz = await this.quizModel.findById(attempt.quiz);
        if (!quiz) return attempt;

        const answersWithCorrectInfo = attempt.answers.map(answer => {
          const question = quiz.questions.find(q => q.id === answer.questionId);
          if (!question) return answer;

          // If answer is incorrect, add correct answer info
          if (!answer.correct) {
            const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
            return {
              ...answer,
              correctOptionId: question.correctOptionId,
              correctOptionText: correctOption?.text || '',
              questionText: question.text,
              allOptions: question.options,
            };
          }

          return answer;
        });

        const attemptObj = attempt.toObject();
        attemptObj.answers = answersWithCorrectInfo;
        return attemptObj;
      })
    );

    return enhancedAttempts;
  }

  
  }
