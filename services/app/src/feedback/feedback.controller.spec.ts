/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
// import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let feedbackServiceMock: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    createMessage: jest.Mock;
    findOneMessages: jest.Mock;
    updateStatus: jest.Mock;
  };

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockId = '507f1f77bcf86cd799439012';

  beforeEach(async () => {
    feedbackServiceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createMessage: jest.fn(),
      findOneMessages: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: feedbackServiceMock,
        },
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // describe('create', () => {
  //   it('should delegate to feedbackService.create', async () => {
  //     const dto = { userId: mockUserId, message: 'Hi' } as CreateFeedbackDto;
  //     const expected = { message: 'Feedback created successfully' };
  //     feedbackServiceMock.create.mockResolvedValue(expected);

  //     const result = await controller.create(dto);

  //     expect(feedbackServiceMock.create).toHaveBeenCalledWith(dto);
  //     expect(result).toEqual(expected);
  //   });
  // });

  describe('findAll', () => {
    it('should delegate to feedbackService.findAll', async () => {
      const expected = { message: 'Feedback found successfully' };
      feedbackServiceMock.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUserId as any);

      expect(feedbackServiceMock.findAll).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to feedbackService.findOne', async () => {
      const expected = { message: 'Feedback found successfully' };
      feedbackServiceMock.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUserId as any, mockId as any);

      expect(feedbackServiceMock.findOne).toHaveBeenCalledWith(
        mockUserId,
        mockId,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should delegate to feedbackService.update', async () => {
      const dto = { id: mockId, message: 'Updated' } as UpdateFeedbackDto;
      const expected = { message: 'Feedback updated successfully' };
      feedbackServiceMock.update.mockResolvedValue(expected);

      const result = await controller.update(mockUserId as any, dto as any);

      expect(feedbackServiceMock.update).toHaveBeenCalledWith(
        mockUserId,
        mockId,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('should delegate to feedbackService.remove', async () => {
      const expected = { message: 'Feedback deleted successfully' };
      feedbackServiceMock.remove.mockResolvedValue(expected);

      const result = await controller.remove(mockUserId as any, mockId as any);

      expect(feedbackServiceMock.remove).toHaveBeenCalledWith(
        mockUserId,
        mockId,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('createMessage', () => {
    it('should delegate to feedbackService.createMessage', async () => {
      const expected = { message: 'Message added successfully' };
      feedbackServiceMock.createMessage.mockResolvedValue(expected);

      const result = await controller.createMessage(
        mockUserId as any,
        mockId as any,
        'Hi' as any,
      );

      expect(feedbackServiceMock.createMessage).toHaveBeenCalledWith(
        mockUserId,
        mockId,
        'Hi',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('findOneMessages', () => {
    it('should delegate to feedbackService.findOneMessages', async () => {
      const expected = { message: 'Messages found successfully' };
      feedbackServiceMock.findOneMessages.mockResolvedValue(expected);

      const result = await controller.findOneMessages(
        mockUserId as any,
        mockId as any,
      );

      expect(feedbackServiceMock.findOneMessages).toHaveBeenCalledWith(
        mockUserId,
        mockId,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('updateStatus', () => {
    it('should delegate to feedbackService.updateStatus', async () => {
      const expected = { message: 'Status updated successfully' };
      feedbackServiceMock.updateStatus.mockResolvedValue(expected);

      const result = await controller.updateStatus(
        mockUserId as any,
        mockId as any,
        'resolved' as any,
      );

      expect(feedbackServiceMock.updateStatus).toHaveBeenCalledWith(
        mockUserId,
        mockId,
        'resolved',
      );
      expect(result).toEqual(expected);
    });
  });
});
