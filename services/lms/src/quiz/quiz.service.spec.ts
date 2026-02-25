/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { QuizService } from './quiz.service';
import { Quiz } from './schema/quiz.schema';
import { QuizAnswer } from './schema/quiz-answer.schema';
import { NotFoundException } from '@nestjs/common';
import { CreateQuizDto, SubmitAnswerItemDto } from './dto/quiz.dto';

describe('QuizService', () => {
  let service: QuizService;
  let quizModelMock: {
    create: jest.Mock;
    findById: jest.Mock;
    find: jest.Mock;
  };
  let quizAnswerModelMock: {
    create: jest.Mock;
    findById: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    quizModelMock = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    quizAnswerModelMock = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: getModelToken(Quiz.name),
          useValue: quizModelMock,
        },
        {
          provide: getModelToken(QuizAnswer.name),
          useValue: quizAnswerModelMock,
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuiz', () => {
    it('should create a quiz', async () => {
      const dto: CreateQuizDto = {
        title: 'Quiz 1',
        description: 'Desc',
        topic: 'math',
        noOfQuestions: 2,
        questions: [],
      };
      const created = { _id: 'quiz-id', ...dto } as any;
      quizModelMock.create.mockResolvedValue(created);

      const result = await service.createQuiz(dto);

      expect(quizModelMock.create).toHaveBeenCalledWith({ ...dto });
      expect(result).toEqual(created);
    });
  });

  describe('getAllQuizzes', () => {
    it('should return all quizzes', async () => {
      const quizzes = [{ _id: '1' }, { _id: '2' }];
      quizModelMock.find.mockResolvedValue(quizzes);

      const result = await service.getAllQuizzes();

      expect(quizModelMock.find).toHaveBeenCalled();
      expect(result).toEqual(quizzes);
    });
  });

  describe('getQuizById', () => {
    it('should return quiz when found', async () => {
      const quiz = { _id: 'quiz-id' };
      quizModelMock.findById.mockResolvedValue(quiz);

      const result = await service.getQuizById('quiz-id');

      expect(quizModelMock.findById).toHaveBeenCalledWith('quiz-id');
      expect(result).toEqual(quiz);
    });

    it('should throw NotFoundException when quiz is not found', async () => {
      quizModelMock.findById.mockResolvedValue(null);

      await expect(service.getQuizById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteQuiz', () => {
    it('should delete quiz when found', async () => {
      const deleteOne = jest.fn();
      const quiz = { _id: 'quiz-id', deleteOne } as any;
      quizModelMock.findById.mockResolvedValue(quiz);

      const result = await service.deleteQuiz('quiz-id');

      expect(quizModelMock.findById).toHaveBeenCalledWith('quiz-id');
      expect(deleteOne).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Quiz deleted successfully' });
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      quizModelMock.findById.mockResolvedValue(null);

      await expect(service.deleteQuiz('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('submitQuizAnswers', () => {
    it('should compute score and create attempt', async () => {
      const quizId = 'quiz-id';
      const quiz = {
        _id: quizId,
        questions: [
          { id: 'q1', correctOptionId: 'o1' },
          { id: 'q2', correctOptionId: 'o2' },
        ],
      } as any;
      quizModelMock.findById.mockResolvedValue(quiz);

      const answers: SubmitAnswerItemDto[] = [
        { questionId: 'q1', selectedOptionId: 'o1' },
        { questionId: 'q2', selectedOptionId: 'wrong' },
      ];

      const createdAttempt = { _id: 'attempt-id' } as any;
      quizAnswerModelMock.create.mockResolvedValue(createdAttempt);

      const result = await service.submitQuizAnswers(quizId, answers);

      expect(quizModelMock.findById).toHaveBeenCalledWith(quizId);
      expect(quizAnswerModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quiz: quiz._id,
          answers: expect.arrayContaining([
            expect.objectContaining({ questionId: 'q1', correct: true }),
            expect.objectContaining({ questionId: 'q2', correct: false }),
          ]),
          total: 2,
        }),
      );
      expect(result).toEqual(createdAttempt);
    });

    it('should throw NotFoundException if quiz is missing', async () => {
      quizModelMock.findById.mockResolvedValue(null);

      await expect(service.submitQuizAnswers('missing-id', [])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMyAttempt', () => {
    it('should return attempt when found', async () => {
      const attempt = { _id: 'attempt-id' };
      quizAnswerModelMock.findById.mockResolvedValue(attempt);

      const result = await service.getMyAttempt('attempt-id');

      expect(quizAnswerModelMock.findById).toHaveBeenCalledWith('attempt-id');
      expect(result).toEqual(attempt);
    });

    it('should throw NotFoundException when attempt not found', async () => {
      quizAnswerModelMock.findById.mockResolvedValue(null);

      await expect(service.getMyAttempt('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMyAttemptsForQuiz', () => {
    it('should return attempts sorted by createdAt desc', async () => {
      const sort = jest.fn().mockResolvedValue([{ _id: 'attempt1' }]);
      quizAnswerModelMock.find.mockReturnValue({ sort } as any);

      const result = await service.getMyAttemptsForQuiz('quiz-id');

      expect(quizAnswerModelMock.find).toHaveBeenCalledWith({
        quiz: 'quiz-id',
      });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual([{ _id: 'attempt1' }]);
    });
  });
});
