/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { getModelToken } from '@nestjs/mongoose';
import { Feedback } from './schema/feedback.schema';
import { RpcException } from '@nestjs/microservices';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let feedbackModelMock: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOneAndDelete: jest.Mock;
  };

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockFeedback = {
    _id: '507f1f77bcf86cd799439012',
    userId: mockUserId,
    feedbackType: 'bug-report',
    userBugReport: 'Bug description',
    email: 'user@example.com',
    message: 'Some feedback',
    status: 'open',
    messages: [],
  };

  beforeEach(async () => {
    feedbackModelMock = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getModelToken(Feedback.name),
          useValue: feedbackModelMock,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create feedback', async () => {
      const dto: CreateFeedbackDto = {
        userId: mockUserId,
        feedbackType: 'bug-report',
        userBugReport: 'Bug description',
        email: 'user@example.com',
        message: 'Some feedback',
      } as CreateFeedbackDto;

      feedbackModelMock.create.mockResolvedValue(mockFeedback);

      const result = await service.create(dto, mockUserId);

      expect(feedbackModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining(dto),
      );
      expect(result).toEqual({
        message: 'Feedback created successfully',
        data: mockFeedback,
      });
    });
  });

  describe('findAll', () => {
    it('should return all feedback for user', async () => {
      const list = [mockFeedback];
      feedbackModelMock.find.mockResolvedValue(list);

      const result = await service.findAll(mockUserId);

      expect(feedbackModelMock.find).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'Feedback found successfully',
        data: list,
      });
    });
  });

  describe('findOne', () => {
    it('should return one feedback', async () => {
      feedbackModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFeedback),
      });

      const result = await service.findOne(mockUserId, mockFeedback._id);

      expect(feedbackModelMock.findOne).toHaveBeenCalledWith({
        _id: mockFeedback._id,
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'Feedback found successfully',
        data: mockFeedback,
      });
    });

    it('should throw RpcException if feedback not found', async () => {
      feedbackModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOne(mockUserId, mockFeedback._id),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('update', () => {
    it('should update feedback', async () => {
      const updated = { ...mockFeedback, status: 'pending' };
      feedbackModelMock.findOneAndUpdate.mockResolvedValue(updated);

      const dto = { status: 'pending' } as unknown as UpdateFeedbackDto;
      const result = await service.update(mockUserId, mockFeedback._id, dto);

      expect(feedbackModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockFeedback._id, userId: mockUserId },
        { $set: dto },
        { new: true },
      );
      expect(result).toEqual({
        message: 'Feedback updated successfully',
        data: updated,
      });
    });

    it('should throw RpcException if update target not found', async () => {
      feedbackModelMock.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, mockFeedback._id, {
          status: 'pending',
        } as unknown as UpdateFeedbackDto),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('remove', () => {
    it('should delete feedback', async () => {
      feedbackModelMock.findOneAndDelete.mockResolvedValue(mockFeedback);

      const result = await service.remove(mockUserId, mockFeedback._id);

      expect(feedbackModelMock.findOneAndDelete).toHaveBeenCalledWith({
        _id: mockFeedback._id,
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'Feedback deleted successfully',
      });
    });

    it('should throw RpcException if delete target not found', async () => {
      feedbackModelMock.findOneAndDelete.mockResolvedValue(null);

      await expect(
        service.remove(mockUserId, mockFeedback._id),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('createMessage', () => {
    it('should append message to feedback', async () => {
      const updated = {
        ...mockFeedback,
        messages: [{ sender: 'user', message: 'Hi', createdAt: new Date() }],
      } as any;
      feedbackModelMock.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.createMessage(
        mockUserId,
        mockFeedback._id,
        'Hi',
      );

      expect(feedbackModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockFeedback._id, userId: mockUserId },
        expect.objectContaining({
          $push: expect.any(Object),
          $set: expect.any(Object),
        }),
        { new: true },
      );
      expect(result).toEqual({
        message: 'Message added successfully',
        data: updated.messages,
      });
    });

    it('should throw RpcException if ticket not found when adding message', async () => {
      feedbackModelMock.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.createMessage(mockUserId, mockFeedback._id, 'Hi'),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('findOneMessages', () => {
    it('should return messages array', async () => {
      const withMessages = { ...mockFeedback, messages: ['m1', 'm2'] } as any;
      feedbackModelMock.findOne.mockResolvedValue(withMessages);

      const result = await service.findOneMessages(
        mockUserId,
        mockFeedback._id,
      );

      expect(feedbackModelMock.findOne).toHaveBeenCalledWith(
        { _id: mockFeedback._id, userId: mockUserId },
        { messages: 1 },
      );
      expect(result).toEqual({
        message: 'Messages found successfully',
        data: withMessages.messages,
      });
    });

    it('should throw RpcException when messages not found', async () => {
      feedbackModelMock.findOne.mockResolvedValue(null);

      await expect(
        service.findOneMessages(mockUserId, mockFeedback._id),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('updateStatus', () => {
    it('should update status field', async () => {
      const updated = { ...mockFeedback, status: 'resolved' };
      feedbackModelMock.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.updateStatus(
        mockUserId,
        mockFeedback._id,
        'resolved',
      );

      expect(feedbackModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockFeedback._id, userId: mockUserId },
        { $set: { status: 'resolved' } },
        { new: true },
      );
      expect(result).toEqual({
        message: 'Status updated successfully',
        data: updated,
      });
    });

    it('should throw RpcException when ticket for status update not found', async () => {
      feedbackModelMock.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateStatus(mockUserId, mockFeedback._id, 'resolved'),
      ).rejects.toThrow(RpcException);
    });
  });
});
