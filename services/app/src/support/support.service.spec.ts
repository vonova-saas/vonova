/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { getModelToken } from '@nestjs/mongoose';
import { Support } from './schema/support.schema';
import { RpcException } from '@nestjs/microservices';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';

describe('SupportService', () => {
  let service: SupportService;
  let supportModelMock: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOneAndDelete: jest.Mock;
  };

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockSupport = {
    _id: '507f1f77bcf86cd799439012',
    userId: mockUserId,
    fullName: 'John Doe',
    email: 'john@example.com',
    category: 'technical',
    subject: 'Issue',
    message: 'Help me',
    status: 'open',
    messages: [],
  };

  beforeEach(async () => {
    supportModelMock = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getModelToken(Support.name),
          useValue: supportModelMock,
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create support ticket', async () => {
      const dto: CreateSupportDto = {
        userId: mockUserId,
        fullName: 'John Doe',
        email: 'john@example.com',
        category: 'technical',
        subject: 'Issue',
        message: 'Help me',
      };

      supportModelMock.create.mockResolvedValue(mockSupport);

      const result = await service.create(dto, mockUserId);

      expect(supportModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining(dto),
      );
      expect(result).toEqual({
        message: 'Support created successfully',
        data: mockSupport,
      });
    });
  });

  describe('findAll', () => {
    it('should return all support tickets for user', async () => {
      const list = [mockSupport];
      supportModelMock.find.mockResolvedValue(list);

      const result = await service.findAll(mockUserId);

      expect(supportModelMock.find).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'Support found successfully',
        data: list,
      });
    });
  });

  describe('findOne', () => {
    it('should return one support ticket', async () => {
      supportModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSupport),
      });

      const result = await service.findOne(mockUserId, mockSupport._id);

      expect(supportModelMock.findOne).toHaveBeenCalledWith({
        _id: mockSupport._id,
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'Support found successfully',
        data: mockSupport,
      });
    });

    it('should throw RpcException if support not found', async () => {
      supportModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOne(mockUserId, mockSupport._id),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('update', () => {
    it('should update support ticket', async () => {
      const updated = { ...mockSupport, status: 'pending' };
      supportModelMock.findOneAndUpdate.mockResolvedValue(updated);

      const dto = { status: 'pending' } as unknown as UpdateSupportDto;
      const result = await service.update(mockUserId, mockSupport._id, dto);

      expect(supportModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockSupport._id, userId: mockUserId },
        { $set: dto },
        { new: true },
      );
      expect(result).toEqual({
        message: 'Support updated successfully',
        data: updated,
      });
    });

    it('should throw RpcException if update target not found', async () => {
      supportModelMock.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, mockSupport._id, {
          status: 'pending',
        } as unknown as UpdateSupportDto),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('remove', () => {
    it('should delete support ticket', async () => {
      supportModelMock.findOneAndDelete.mockResolvedValue(mockSupport);

      const result = await service.remove(mockUserId, mockSupport._id);

      expect(supportModelMock.findOneAndDelete).toHaveBeenCalledWith({
        _id: mockSupport._id,
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'Support deleted successfully',
      });
    });

    it('should throw RpcException if delete target not found', async () => {
      supportModelMock.findOneAndDelete.mockResolvedValue(null);

      await expect(service.remove(mockUserId, mockSupport._id)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('createMessage', () => {
    it('should append message to support ticket', async () => {
      const updated = {
        ...mockSupport,
        messages: [{ sender: 'user', message: 'Hi', createdAt: new Date() }],
      };
      supportModelMock.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.createMessage(
        mockUserId,
        mockSupport._id,
        'Hi',
      );

      expect(supportModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockSupport._id, userId: mockUserId },
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
      supportModelMock.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.createMessage(mockUserId, mockSupport._id, 'Hi'),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('findOneMessages', () => {
    it('should return messages array', async () => {
      const withMessages = { ...mockSupport, messages: ['m1', 'm2'] } as any;
      supportModelMock.findOne.mockResolvedValue(withMessages);

      const result = await service.findOneMessages(mockUserId, mockSupport._id);

      expect(supportModelMock.findOne).toHaveBeenCalledWith(
        { _id: mockSupport._id, userId: mockUserId },
        { messages: 1 },
      );
      expect(result).toEqual({
        message: 'Messages found successfully',
        data: withMessages.messages,
      });
    });

    it('should throw RpcException when messages not found', async () => {
      supportModelMock.findOne.mockResolvedValue(null);

      await expect(
        service.findOneMessages(mockUserId, mockSupport._id),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('updateStatus', () => {
    it('should update status field', async () => {
      const updated = { ...mockSupport, status: 'resolved' };
      supportModelMock.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.updateStatus(
        mockUserId,
        mockSupport._id,
        'resolved',
      );

      expect(supportModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockSupport._id, userId: mockUserId },
        { $set: { status: 'resolved' } },
        { new: true },
      );
      expect(result).toEqual({
        message: 'Status updated successfully',
        data: updated,
      });
    });

    it('should throw RpcException when ticket for status update not found', async () => {
      supportModelMock.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateStatus(mockUserId, mockSupport._id, 'resolved'),
      ).rejects.toThrow(RpcException);
    });
  });
});
