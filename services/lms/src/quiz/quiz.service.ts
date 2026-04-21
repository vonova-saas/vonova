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
    const quiz = await this.quizModel.findById(quizId).select('-questions.correctOptionId');
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Return quiz without correct answers
    return quiz;
  }

  async submitStudentQuiz(quizId: string, answers: SubmitAnswerItemDto[], userId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    const total = quiz.questions.length;
    let score = 0;
    const formatted: {
      questionId: string;
      selectedOptionId: string;
      correct: boolean;
    }[] = [];

    for (const ans of answers) {
      const q = quiz.questions.find((q) => q.id === ans.questionId);
      if (!q) continue;

      const correct = q.correctOptionId === ans.selectedOptionId;
      if (correct) score++;

      formatted.push({
        questionId: ans.questionId,
        selectedOptionId: ans.selectedOptionId,
        correct,
      });
    }

    const percentage = total ? Math.round((score / total) * 10000) / 100 : 0;

    const attempt = await this.answerModel.create({
      quiz: quiz._id,
      userId,
      answers: formatted,
      score,
      total,
      percentage,
    });

    return attempt;
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
      .populate('quiz', 'title description topic noOfQuestions createdAt')
      .sort({ createdAt: -1 });

    return attempts;
  }

  
  }
