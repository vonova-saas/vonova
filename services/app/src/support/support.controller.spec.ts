/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
// import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';

describe('SupportController', () => {
  let controller: SupportController;
  let supportServiceMock: {
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
    supportServiceMock = {
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
      controllers: [SupportController],
      providers: [
        {
          provide: SupportService,
          useValue: supportServiceMock,
        },
      ],
    }).compile();

    controller = module.get<SupportController>(SupportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // describe('create', () => {
  //   it('should delegate to supportService.create', async () => {
  //     const dto = { userId: mockUserId, message: 'Hi' } as CreateSupportDto;
  //     const expected = { message: 'Support created successfully' };
  //     supportServiceMock.create.mockResolvedValue(expected);

  //     const result = await controller.create(dto as any);

  //     expect(supportServiceMock.create).toHaveBeenCalledWith(dto);
  //     expect(result).toEqual(expected);
  //   });
  // });

  describe('findAll', () => {
    it('should delegate to supportService.findAll', async () => {
      const expected = { message: 'Support found successfully' };
      supportServiceMock.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUserId as any);

      expect(supportServiceMock.findAll).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to supportService.findOne', async () => {
      const expected = { message: 'Support found successfully' };
      supportServiceMock.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUserId as any, mockId as any);

      expect(supportServiceMock.findOne).toHaveBeenCalledWith(
        mockUserId,
        mockId,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should delegate to supportService.update', async () => {
      const dto = { id: mockId, message: 'Updated' } as UpdateSupportDto;
      const expected = { message: 'Support updated successfully' };
      supportServiceMock.update.mockResolvedValue(expected);

      const result = await controller.update(mockUserId as any, dto as any);

      expect(supportServiceMock.update).toHaveBeenCalledWith(
        mockUserId,
        mockId,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('should delegate to supportService.remove', async () => {
      const expected = { message: 'Support deleted successfully' };
      supportServiceMock.remove.mockResolvedValue(expected);

      const result = await controller.remove(mockUserId as any, mockId as any);

      expect(supportServiceMock.remove).toHaveBeenCalledWith(
        mockUserId,
        mockId,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('createMessage', () => {
    it('should delegate to supportService.createMessage', async () => {
      const expected = { message: 'Message added successfully' };
      supportServiceMock.createMessage.mockResolvedValue(expected);

      const result = await controller.createMessage(
        mockUserId as any,
        mockId as any,
        'Hi' as any,
      );

      expect(supportServiceMock.createMessage).toHaveBeenCalledWith(
        mockUserId,
        mockId,
        'Hi',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('findOneMessages', () => {
    it('should delegate to supportService.findOneMessages', async () => {
      const expected = { message: 'Messages found successfully' };
      supportServiceMock.findOneMessages.mockResolvedValue(expected);

      const result = await controller.findOneMessages(
        mockUserId as any,
        mockId as any,
      );

      expect(supportServiceMock.findOneMessages).toHaveBeenCalledWith(
        mockUserId,
        mockId,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('updateStatus', () => {
    it('should delegate to supportService.updateStatus', async () => {
      const expected = { message: 'Status updated successfully' };
      supportServiceMock.updateStatus.mockResolvedValue(expected);

      const result = await controller.updateStatus(
        mockUserId as any,
        mockId as any,
        'resolved' as any,
      );

      expect(supportServiceMock.updateStatus).toHaveBeenCalledWith(
        mockUserId,
        mockId,
        'resolved',
      );
      expect(result).toEqual(expected);
    });
  });
});
