import { Test, TestingModule } from '@nestjs/testing';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import {
  CreateQuizDto,
  SubmitAnswerItemDto,
  UpdateQuizDto,
} from './dto/quiz.dto';

describe('QuizController', () => {
  let controller: QuizController;
  let quizServiceMock: {
    createQuiz: jest.Mock;
    updateQuiz: jest.Mock;
    getAllQuizzes: jest.Mock;
    getQuizById: jest.Mock;
    deleteQuiz: jest.Mock;
    submitQuizAnswers: jest.Mock;
    getMyAttempt: jest.Mock;
    getMyAttemptsForQuiz: jest.Mock;
  };

  beforeEach(async () => {
    quizServiceMock = {
      createQuiz: jest.fn(),
      updateQuiz: jest.fn(),
      getAllQuizzes: jest.fn(),
      getQuizById: jest.fn(),
      deleteQuiz: jest.fn(),
      submitQuizAnswers: jest.fn(),
      getMyAttempt: jest.fn(),
      getMyAttemptsForQuiz: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [
        {
          provide: QuizService,
          useValue: quizServiceMock,
        },
      ],
    }).compile();

    controller = module.get<QuizController>(QuizController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createQuiz', () => {
    it('should delegate to quizService.createQuiz', async () => {
      const dto: CreateQuizDto = {
        title: 'Quiz 1',
        description: 'Desc',
        topic: 'math',
        noOfQuestions: 2,
        questions: [],
      };
      const expected: CreateQuizDto & { id: string } = { id: '1', ...dto };
      quizServiceMock.createQuiz.mockResolvedValue(expected);

      const result = await controller.createQuiz(dto);

      expect(quizServiceMock.createQuiz).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('updateQuiz', () => {
    it('should delegate to quizService.updateQuiz', async () => {
      const id = 'quiz-id';
      const dto: UpdateQuizDto = { title: 'Updated title' } as UpdateQuizDto;
      const expected: UpdateQuizDto & { id: string } = { id, ...dto };
      quizServiceMock.updateQuiz.mockResolvedValue(expected);

      const result = await controller.updateQuiz(id, dto);

      expect(quizServiceMock.updateQuiz).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('getAllQuizzes', () => {
    it('should delegate to quizService.getAllQuizzes', async () => {
      const expected = [{ id: '1' }, { id: '2' }] as any[];
      quizServiceMock.getAllQuizzes.mockResolvedValue(expected);

      const result = await controller.getAllQuizzes();

      expect(quizServiceMock.getAllQuizzes).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('getQuiz', () => {
    it('should delegate to quizService.getQuizById', async () => {
      const id = 'quiz-id';
      const expected: { id: string } = { id };
      quizServiceMock.getQuizById.mockResolvedValue(expected);

      const result = await controller.getQuiz(id);

      expect(quizServiceMock.getQuizById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('deleteQuiz', () => {
    it('should delegate to quizService.deleteQuiz', async () => {
      const id = 'quiz-id';
      const expected: { message: string } = {
        message: 'Quiz deleted successfully',
      };
      quizServiceMock.deleteQuiz.mockResolvedValue(expected);

      const result = await controller.deleteQuiz(id);

      expect(quizServiceMock.deleteQuiz).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('submitQuiz', () => {
    it('should delegate to quizService.submitQuizAnswers', async () => {
      const quizId = 'quiz-id';
      const answers: SubmitAnswerItemDto[] = [
        { questionId: 'q1', selectedOptionId: 'o1' },
      ];
      const expected: { id: string } = { id: 'attempt-id' };
      quizServiceMock.submitQuizAnswers.mockResolvedValue(expected);

      const result = await controller.submitQuiz(quizId, answers);

      expect(quizServiceMock.submitQuizAnswers).toHaveBeenCalledWith(
        quizId,
        answers,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('getMyAttempt', () => {
    it('should delegate to quizService.getMyAttempt', async () => {
      const attemptId = 'attempt-id';
      const expected: { id: string } = { id: attemptId };
      quizServiceMock.getMyAttempt.mockResolvedValue(expected);

      const result = await controller.getMyAttempt(attemptId);

      expect(quizServiceMock.getMyAttempt).toHaveBeenCalledWith(attemptId);
      expect(result).toEqual(expected);
    });
  });

  describe('getMyAttempts', () => {
    it('should delegate to quizService.getMyAttemptsForQuiz', async () => {
      const quizId = 'quiz-id';
      const expected = [{ id: 'attempt-id' }] as any[];
      quizServiceMock.getMyAttemptsForQuiz.mockResolvedValue(expected);

      const result = await controller.getMyAttempts(quizId);

      expect(quizServiceMock.getMyAttemptsForQuiz).toHaveBeenCalledWith(quizId);
      expect(result).toEqual(expected);
    });
  });
});
