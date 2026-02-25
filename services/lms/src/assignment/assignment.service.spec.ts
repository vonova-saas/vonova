/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AssignmentService } from './assignment.service';
import { Assignment } from './schema/assignment.schema';
import { AssignmentAnswer } from './schema/assignment-answer.schema';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateAssignmentDto, SubmitAnswerItemDto } from './dto/assignment.dto';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let assignmentModelMock: {
    create: jest.Mock;
    findById: jest.Mock;
    find: jest.Mock;
  };
  let assignmentAnswerModelMock: {
    create: jest.Mock;
    findById: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    assignmentModelMock = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    assignmentAnswerModelMock = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: getModelToken(Assignment.name),
          useValue: assignmentModelMock,
        },
        {
          provide: getModelToken(AssignmentAnswer.name),
          useValue: assignmentAnswerModelMock,
        },
      ],
    }).compile();

    service = module.get<AssignmentService>(AssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAssignment', () => {
    it('should create assignment with nullable createdBy', async () => {
      const dto: CreateAssignmentDto = {
        title: 'Assignment 1',
        description: 'Desc',
        topic: 'math',
        noOfQuestions: 2,
        questions: [],
      };
      const created = { _id: 'a1', ...dto };
      assignmentModelMock.create.mockResolvedValue(created);

      const result = await service.createAssignment(dto, null);

      expect(assignmentModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          topic: dto.topic,
        }),
      );
      expect(result).toEqual(created);
    });
  });

  describe('getAllAssignments', () => {
    it('should return all assignments', async () => {
      const assignments = [{ _id: 'a1' }, { _id: 'a2' }];
      assignmentModelMock.find.mockResolvedValue(assignments);

      const result = await service.getAllAssignments();

      expect(assignmentModelMock.find).toHaveBeenCalled();
      expect(result).toEqual(assignments);
    });
  });

  describe('getAssignmentById', () => {
    it('should return assignment when found', async () => {
      const assignment = { _id: 'a1' };
      assignmentModelMock.findById.mockResolvedValue(assignment);

      const result = await service.getAssignmentById('a1');

      expect(assignmentModelMock.findById).toHaveBeenCalledWith('a1');
      expect(result).toEqual(assignment);
    });

    it('should throw NotFoundException when not found', async () => {
      assignmentModelMock.findById.mockResolvedValue(null);

      await expect(service.getAssignmentById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAssignment', () => {
    it('should delete assignment when found', async () => {
      const deleteOne = jest.fn();
      const assignment = { _id: 'a1', deleteOne } as any;
      assignmentModelMock.findById.mockResolvedValue(assignment);

      const result = await service.deleteAssignment('a1');

      expect(assignmentModelMock.findById).toHaveBeenCalledWith('a1');
      expect(deleteOne).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Assignment deleted successfully' });
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      assignmentModelMock.findById.mockResolvedValue(null);

      await expect(service.deleteAssignment('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('submitAssignmentAnswers', () => {
    it('should compute score and create attempt', async () => {
      const assignmentId = 'a1';
      const assignment = {
        _id: assignmentId,
        questions: [
          { id: 'q1', correctOptionId: 'o1' },
          { id: 'q2', correctOptionId: 'o2' },
        ],
      } as any;
      assignmentModelMock.findById.mockResolvedValue(assignment);

      const answers: SubmitAnswerItemDto[] = [
        { questionId: 'q1', selectedOptionId: 'o1' },
        { questionId: 'q2', selectedOptionId: 'wrong' },
      ];

      const createdAttempt = { _id: 'attempt1', id: 'attempt1' } as any;
      assignmentAnswerModelMock.create.mockResolvedValue(createdAttempt);

      const result = await service.submitAssignmentAnswers(
        assignmentId,
        answers,
        undefined,
      );

      expect(assignmentModelMock.findById).toHaveBeenCalledWith(assignmentId);
      expect(assignmentAnswerModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignment: assignment._id,
          answers: expect.arrayContaining([
            expect.objectContaining({ questionId: 'q1', correct: true }),
            expect.objectContaining({ questionId: 'q2', correct: false }),
          ]),
          total: 2,
        }),
      );
      expect(result).toMatchObject({
        assignmentId,
        total: 2,
      });
    });

    it('should throw NotFoundException if assignment is missing', async () => {
      assignmentModelMock.findById.mockResolvedValue(null);

      await expect(
        service.submitAssignmentAnswers('missing', []),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserAttempt', () => {
    it('should return attempt when found and user is owner or no userId', async () => {
      const attempt = {
        _id: 'attempt1',
        userId: 'user1',
        toString: () => 'user1',
      };
      assignmentAnswerModelMock.findById.mockResolvedValue(attempt as any);

      const result = await service.getUserAttempt('attempt1');

      expect(assignmentAnswerModelMock.findById).toHaveBeenCalledWith(
        'attempt1',
      );
      expect(result).toEqual(attempt as any);
    });

    it('should throw NotFoundException when attempt not found', async () => {
      assignmentAnswerModelMock.findById.mockResolvedValue(null);

      await expect(service.getUserAttempt('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const attempt = {
        _id: 'attempt1',
        userId: { toString: () => 'other-user' },
      } as any;
      assignmentAnswerModelMock.findById.mockResolvedValue(attempt);

      await expect(service.getUserAttempt('attempt1', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUserAttemptsForAssignment', () => {
    it('should filter by assignmentId and userId when userId provided', async () => {
      const sort = jest.fn().mockResolvedValue([{ _id: 'attempt1' }]);
      assignmentAnswerModelMock.find.mockReturnValue({ sort } as any);

      const result = await service.getUserAttemptsForAssignment('a1', 'user1');

      expect(assignmentAnswerModelMock.find).toHaveBeenCalledWith({
        assignment: 'a1',
        userId: 'user1',
      });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual([{ _id: 'attempt1' }]);
    });

    it('should filter only by assignmentId when userId not provided', async () => {
      const sort = jest.fn().mockResolvedValue([{ _id: 'attempt1' }]);
      assignmentAnswerModelMock.find.mockReturnValue({ sort } as any);

      const result = await service.getUserAttemptsForAssignment('a1');

      expect(assignmentAnswerModelMock.find).toHaveBeenCalledWith({
        assignment: 'a1',
      });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual([{ _id: 'attempt1' }]);
    });
  });
});
