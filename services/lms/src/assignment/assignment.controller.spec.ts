/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import {
  CreateAssignmentDto,
  SubmitAnswerItemDto,
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dto/assignment.dto';

describe('AssignmentController', () => {
  let controller: AssignmentController;
  let assignmentServiceMock: {
    createAssignment: jest.Mock;
    updateAssignment: jest.Mock;
    getAllAssignments: jest.Mock;
    getAssignmentById: jest.Mock;
    deleteAssignment: jest.Mock;
    submitAssignmentAnswers: jest.Mock;
    getUserAttempt: jest.Mock;
    getUserAttemptsForAssignment: jest.Mock;
  };

  beforeEach(async () => {
    assignmentServiceMock = {
      createAssignment: jest.fn(),
      updateAssignment: jest.fn(),
      getAllAssignments: jest.fn(),
      getAssignmentById: jest.fn(),
      deleteAssignment: jest.fn(),
      submitAssignmentAnswers: jest.fn(),
      getUserAttempt: jest.fn(),
      getUserAttemptsForAssignment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentController],
      providers: [
        {
          provide: AssignmentService,
          useValue: assignmentServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AssignmentController>(AssignmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to assignmentService.createAssignment and wrap response', async () => {
      const dto: CreateAssignmentDto = {
        title: 'Assignment 1',
        description: 'Desc',
        topic: 'math',
        noOfQuestions: 2,
        questions: [],
      };
      const created = { id: 'a1', ...dto };
      assignmentServiceMock.createAssignment.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(assignmentServiceMock.createAssignment).toHaveBeenCalledWith(
        dto,
        null,
      );
      expect(result).toEqual({
        message: 'Assignment created successfully',
        data: created,
      });
    });
  });

  describe('update', () => {
    it('should delegate to assignmentService.updateAssignment and wrap response', async () => {
      const id = 'assignment-id';
      const dto: UpdateAssignmentDto = {
        title: 'Updated',
      } as UpdateAssignmentDto;
      const updated = { id, ...dto };
      assignmentServiceMock.updateAssignment.mockResolvedValue(updated);

      const result = await controller.update(id, dto);

      expect(assignmentServiceMock.updateAssignment).toHaveBeenCalledWith(
        id,
        dto,
      );
      expect(result).toEqual({
        message: 'Assignment updated successfully',
        data: updated,
      });
    });
  });

  describe('getAll', () => {
    it('should delegate to assignmentService.getAllAssignments and wrap response', async () => {
      const data = [{ id: 'a1' }];
      assignmentServiceMock.getAllAssignments.mockResolvedValue(data);

      const result = await controller.getAll();

      expect(assignmentServiceMock.getAllAssignments).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Assignments retrieved successfully',
        data,
      });
    });
  });

  describe('getById', () => {
    it('should delegate to assignmentService.getAssignmentById and wrap response', async () => {
      const id = 'assignment-id';
      const data = { id };
      assignmentServiceMock.getAssignmentById.mockResolvedValue(data);

      const result = await controller.getById(id);

      expect(assignmentServiceMock.getAssignmentById).toHaveBeenCalledWith(id);
      expect(result).toEqual({
        message: 'Assignment retrieved successfully',
        data,
      });
    });
  });

  describe('delete', () => {
    it('should delegate to assignmentService.deleteAssignment and wrap response', async () => {
      const id = 'assignment-id';
      const data = { message: 'Assignment deleted successfully' };
      assignmentServiceMock.deleteAssignment.mockResolvedValue(data);

      const result = await controller.delete(id);

      expect(assignmentServiceMock.deleteAssignment).toHaveBeenCalledWith(id);
      expect(result).toEqual({
        message: 'Assignment deleted successfully',
        data,
      });
    });
  });

  describe('submit', () => {
    it('should delegate to assignmentService.submitAssignmentAnswers and wrap response', async () => {
      const assignmentId = 'assignment-id';
      const answers: SubmitAnswerItemDto[] = [
        { questionId: 'q1', selectedOptionId: 'o1' },
      ];
      const dto: SubmitAssignmentDto = { answers };
      const resultData = { attemptId: 'attempt-1' };
      assignmentServiceMock.submitAssignmentAnswers.mockResolvedValue(
        resultData,
      );

      const result = await controller.submit(assignmentId, answers);

      expect(
        assignmentServiceMock.submitAssignmentAnswers,
      ).toHaveBeenCalledWith(assignmentId, answers);
      expect(result).toEqual({
        message: 'Assignment submitted successfully',
        data: resultData,
      });
    });
  });

  describe('getAttempt', () => {
    it('should delegate to assignmentService.getUserAttempt and wrap response', async () => {
      const attemptId = 'attempt-id';
      const data = { id: attemptId };
      assignmentServiceMock.getUserAttempt.mockResolvedValue(data);

      const result = await controller.getAttempt(attemptId);

      expect(assignmentServiceMock.getUserAttempt).toHaveBeenCalledWith(
        attemptId,
      );
      expect(result).toEqual({
        message: 'Attempt retrieved successfully',
        data,
      });
    });
  });

  describe('getAttempts', () => {
    it('should delegate to assignmentService.getUserAttemptsForAssignment and wrap response', async () => {
      const assignmentId = 'assignment-id';
      const data = [{ id: 'attempt-1' }];
      assignmentServiceMock.getUserAttemptsForAssignment.mockResolvedValue(
        data,
      );

      const result = await controller.getAttempts(assignmentId);

      expect(
        assignmentServiceMock.getUserAttemptsForAssignment,
      ).toHaveBeenCalledWith(assignmentId);
      expect(result).toEqual({
        message: 'Attempts retrieved successfully',
        data,
      });
    });
  });
});
