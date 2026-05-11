import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { EnrollService } from '../course/enroll/enroll.service';

type QuestionLike = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId?: string;
};

function resolveCorrectOptionFromQuestion(question: QuestionLike): {
  correctOptionId: string;
  correctOptionText: string;
} {
  const qAny = question as QuestionLike & { correct_option_id?: string };
  const raw =
    question.correctOptionId ?? qAny.correct_option_id ?? '';
  const cid = String(raw).trim();
  const opts = question.options ?? [];
  const opt = cid
    ? opts.find((o) => String(o.id).trim() === cid)
    : undefined;
  return {
    correctOptionId: cid,
    correctOptionText: opt?.text?.trim() ?? '',
  };
}

function sameUserId(a: unknown, b: unknown): boolean {
  const sa = a instanceof Types.ObjectId ? a.toHexString() : String(a ?? '');
  const sb = b instanceof Types.ObjectId ? b.toHexString() : String(b ?? '');
  return sa === sb;
}

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(QuizAnswer.name) private answerModel: Model<QuizAnswer>,
    private readonly enrollService: EnrollService,
  ) { }

  private async assertQuizAccess(
    quiz: Quiz,
    userId: string,
    enrolledCourseIds?: string[],
  ) {
    if (quiz.visibility !== 'PRIVATE') return;

    if (!quiz.courseId) {
      throw new ForbiddenException('Quiz not available');
    }

    const cid = quiz.courseId.toString();
    const allowed = await this.enrollService.canAccessCourseContent(
      userId,
      cid,
    );
    if (allowed) return;

    if (enrolledCourseIds?.includes(cid)) return;

    throw new ForbiddenException('You do not have access to this quiz');
  }

  // ===== INSTRUCTOR-SPECIFIC METHODS =====

  async createInstructorQuiz(dto: CreateQuizDto, userId: string) {
    // Convert string IDs to ObjectIds if provided
    const createData: any = {
      ...dto,
      createdBy: userId,
      visibility: dto.visibility || 'PUBLIC',
    };

    if (dto.courseId) {
      createData.courseId = new Types.ObjectId(dto.courseId);
    }
    if (dto.lessonId) {
      createData.lessonId = new Types.ObjectId(dto.lessonId);
    }

    const quiz = await this.quizModel.create(createData);
    return quiz;
  }

  async updateInstructorQuiz(
    quizId: string,
    dto: UpdateQuizDto,
    userId: string,
  ) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Ensure user can update this quiz
    if (quiz.createdBy.toString() !== userId) {
      throw new NotFoundException('Quiz not found or access denied');
    }

    if (dto.title) quiz.title = dto.title;
    if (dto.description !== undefined) quiz.description = dto.description;
    if (dto.topic) quiz.topic = dto.topic;
    if (dto.noOfQuestions) quiz.noOfQuestions = dto.noOfQuestions;
    if (dto.visibility) quiz.visibility = dto.visibility;

    // Update course/lesson linking if provided
    if (dto.courseId !== undefined) {
      quiz.courseId = dto.courseId ? new Types.ObjectId(dto.courseId) : null;
    }
    if (dto.lessonId !== undefined) {
      quiz.lessonId = dto.lessonId ? new Types.ObjectId(dto.lessonId) : null;
    }

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

  async getInstructorQuizzes(userId: string, courseId?: string) {
    const filter: any = { createdBy: userId };
    if (courseId) {
      filter.$or = [
        { courseId: new Types.ObjectId(courseId) },
        { courseId: null },
        { courseId: { $exists: false } },
      ];
    }
    return this.quizModel.find(filter).sort({ createdAt: -1 });
  }

  async getInstructorQuizzesByCourse(userId: string, courseId: string) {
    return this.quizModel.find({
      createdBy: userId,
      courseId: new Types.ObjectId(courseId),
    }).sort({ createdAt: -1 });
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

    return this.answerModel.find({ quiz: quizId }).sort({ createdAt: -1 });
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

    const scores = attempts.map((attempt) => attempt.percentage);
    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const passRate =
      (attempts.filter((attempt) => attempt.percentage >= 70).length /
        totalAttempts) *
      100;

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

  async getAvailableQuizzesForStudents(userId?: string, enrolledCourseIds?: string[]) {
    void enrolledCourseIds;

    const quizzes = await this.quizModel
      .find()
      .select('-questions.correctOptionId')
      .sort({ createdAt: -1 });

    // PRIVATE quizzes are course-only and must not appear in the global Quiz
    // listing — even for enrolled students. They reach a PRIVATE quiz only
    // by clicking it from the lesson page, where `getQuizForStudent` runs
    // `assertQuizAccess` to enforce enrollment. The creator (instructor)
    // still sees their own private quizzes here so they can manage them.
    const filtered: typeof quizzes = [];
    for (const quiz of quizzes) {
      const visibility = quiz.visibility ?? 'PUBLIC';
      const isOwner = !!userId && String(quiz.createdBy) === userId;

      if (visibility === 'PRIVATE') {
        if (isOwner) filtered.push(quiz);
        continue;
      }

      filtered.push(quiz);
    }

    if (!userId) {
      return filtered;
    }

    const quizzesWithStatus = await Promise.all(
      filtered.map(async (quiz) => {
        const existingAttempt = await this.answerModel.findOne({
          quiz: quiz._id,
          userId,
        });

        const quizObj = quiz.toObject();
        return {
          ...quizObj,
          isCompleted: !!existingAttempt,
          completedAt: existingAttempt?.submittedAt || null,
          score: existingAttempt?.score || null,
          percentage: existingAttempt?.percentage || null,
        };
      }),
    );

    return quizzesWithStatus;
  }

  async getQuizForStudent(quizId: string, userId: string, enrolledCourseIds?: string[]) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    await this.assertQuizAccess(quiz, userId, enrolledCourseIds);

    // Prefer the quiz document's ObjectId so the query matches how attempts are stored.
    const existingAttempt = await this.answerModel.findOne({
      quiz: quiz._id,
      userId,
    });

    // If student hasn't attempted, return quiz without correct answers
    if (!existingAttempt) {
      const quizObj = quiz.toObject();
      // Remove correct answers from questions
      const quizWithoutAnswers = {
        ...quizObj,
        questions: quizObj.questions.map((q) => {
          const { correctOptionId, ...questionWithoutAnswer } = q;
          return questionWithoutAnswer;
        }),
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
    const questionsWithAnswers = quizObj.questions.map((question) => {
      const qKey = String(question.id).trim();
      const studentAnswer = attemptObj.answers.find(
        (ans) => String(ans.questionId).trim() === qKey,
      );
      const { correctOptionId, correctOptionText } =
        resolveCorrectOptionFromQuestion(question as QuestionLike);
      return {
        ...question,
        correctOptionId,
        correctOptionText,
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
      },
    };
  }

  async submitStudentQuiz(
    quizId: string,
    answers: SubmitAnswerItemDto[],
    userId: string,
    enrolledCourseIds?: string[],
  ) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');

    await this.assertQuizAccess(quiz, userId, enrolledCourseIds);

    const existingAttempt = await this.answerModel.findOne({
      quiz: quiz._id,
      userId,
    });
    if (existingAttempt) {
      throw new ConflictException('You already attempted this quiz');
    }

    const totalQuestions = quiz.questions.length;
    let answeredQuestions = 0;
    let score = 0;
    const formatted: {
      questionId: string;
      selectedOptionId: string | null;
      correct: boolean | null;
    }[] = [];

    // Process all questions with student answers and correct info
    const questionsWithResults = quiz.questions.map((question) => {
      const studentAnswer = answers.find(
        (ans) => ans.questionId === question.id,
      );
      const selectedOptionId = studentAnswer?.selectedOptionId || null;

      // Only count as answered if student provided an answer
      const isAnswered = selectedOptionId !== null;
      if (isAnswered) answeredQuestions++;

      // Only count as correct if answered and matches
      const correct =
        isAnswered && question.correctOptionId === selectedOptionId;
      if (correct) score++;

      // Add all questions to formatted answers (including unanswered)
      formatted.push({
        questionId: question.id,
        selectedOptionId,
        correct: isAnswered ? correct : null, // null for unanswered questions
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
        const correctOption = question.options.find(
          (opt) => opt.id === question.correctOptionId,
        );
        questionResult.correctOptionId = question.correctOptionId;
        questionResult.correctOptionText = correctOption?.text || '';
      }

      return questionResult;
    });

    const percentage = answeredQuestions
      ? Math.round((score / answeredQuestions) * 10000) / 100
      : 0;

    let attempt: QuizAnswer;
    try {
      attempt = await this.answerModel.create({
        quiz: quiz._id,
        userId,
        answers: formatted,
        score,
        total: answeredQuestions, // Store answered questions count
        percentage,
      });
    } catch (error: unknown) {
      const mongoError = error as { code?: number };
      // Compound unique index (quiz + userId) guarantees one attempt only even under concurrency.
      if (mongoError?.code === 11000) {
        throw new ConflictException('You already attempted this quiz');
      }
      throw error;
    }

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
    if (!sameUserId(attempt.userId, userId)) {
      throw new NotFoundException('Attempt not found or access denied');
    }

    const quiz = await this.quizModel.findById(attempt.quiz);
    const attemptObj = attempt.toObject() as {
      answers: {
        questionId: string;
        selectedOptionId: string | null;
        correct: boolean | null;
      }[];
    };

    if (!quiz) {
      return attempt.toObject();
    }

    const enhancedAnswers = attemptObj.answers.map((answer) => {
      const qid = String(answer.questionId).trim();
      const question = quiz.questions.find(
        (q) => String(q.id).trim() === qid,
      );
      if (!question) {
        return {
          ...answer,
          questionText: String(answer.questionId),
          selectedOptionText: answer.selectedOptionId
            ? String(answer.selectedOptionId)
            : 'No answer',
        };
      }

      const sel = (answer.selectedOptionId || '').trim();
      const selectedOption = question.options.find(
        (o) => String(o.id).trim() === sel,
      );
      const { correctOptionId, correctOptionText } =
        resolveCorrectOptionFromQuestion(question as QuestionLike);

      const base = {
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        correct: answer.correct,
        questionText: question.text,
        selectedOptionText:
          selectedOption?.text ||
          (answer.selectedOptionId == null ? 'No answer' : '—'),
      };

      if (answer.correct) {
        return base;
      }

      return {
        ...base,
        correctOptionId,
        correctOptionText,
      };
    });

    return {
      ...attemptObj,
      answers: enhancedAnswers,
    };
  }

  async getStudentQuizAttempts(userId: string) {
    const attempts = await this.answerModel
      .find({ userId })
      .populate(
        'quiz',
        'title description topic noOfQuestions createdAt questions',
      )
      .sort({ createdAt: -1 });

    // Enhance attempts with correct answers for incorrect responses
    const enhancedAttempts = await Promise.all(
      attempts.map(async (attempt) => {
        const quiz = await this.quizModel.findById(attempt.quiz);
        if (!quiz) return attempt;

        const answersWithCorrectInfo = attempt.answers.map((answer) => {
          const qid = String(answer.questionId).trim();
          const question = quiz.questions.find(
            (q) => String(q.id).trim() === qid,
          );
          if (!question) return answer;

          // If answer is incorrect, add correct answer info
          if (!answer.correct) {
            const { correctOptionId, correctOptionText } =
              resolveCorrectOptionFromQuestion(question as QuestionLike);
            return {
              ...answer,
              correctOptionId,
              correctOptionText,
              questionText: question.text,
              allOptions: question.options,
            };
          }

          return answer;
        });

        const attemptObj = attempt.toObject();
        attemptObj.answers = answersWithCorrectInfo;
        return attemptObj;
      }),
    );

    return enhancedAttempts;
  }
}
