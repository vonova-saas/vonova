import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
  ) { }

  async createQuiz(dto: CreateQuizDto, userId: string) {
    const quiz = await this.quizModel.create({ ...dto, createdBy: userId });
    return quiz;
  }

  async updateQuiz(quizId: string, dto: UpdateQuizDto, userId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Optional: Add authorization check to ensure user can update this quiz
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

  async getAllQuizzes(userId: string) {
    return this.quizModel.find({ createdBy: userId });
  }

  async getQuizById(quizId: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async deleteQuiz(quizId: string, userId: string) {
    const quiz = await this.quizModel.findOne({ _id: quizId, createdBy: userId });
    if (!quiz) throw new NotFoundException('Quiz not found');

    await quiz.deleteOne();
    return { message: 'Quiz deleted successfully' };
  }

  // ===== Attempts =====
  async submitQuizAnswers(quizId: string, answers: SubmitAnswerItemDto[]) {
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
      userId: 'student', // Default for student submissions
      answers: formatted,
      score,
      total,
      percentage,
    });

    return attempt;
  }

  async getMyAttempt(attemptId: string) {
    const attempt = await this.answerModel.findById(attemptId);
    if (!attempt) throw new NotFoundException('Attempt not found');
    return attempt;
  }

  async getMyAttemptsForQuiz(quizId: string, userId: string) {
    return this.answerModel.find({ quiz: quizId, userId }).sort({ createdAt: -1 });
  }
}
