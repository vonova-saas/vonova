import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserAccount } from './schema/account.schema';
import { RpcException } from '@nestjs/microservices';
import { UpdateAccountDto } from './dto/update-account.dto';

describe('AccountService', () => {
  let service: AccountService;
  let accountModelMock: {
    findOne: jest.Mock;
    create: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockAccount = {
    _id: '507f1f77bcf86cd799439012',
    userId: mockUserId,
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: null,
  };

  beforeEach(async () => {
    accountModelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getModelToken(UserAccount.name),
          useValue: accountModelMock,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return existing account', async () => {
      accountModelMock.findOne.mockResolvedValue(mockAccount);

      const result = await service.findOne(mockUserId);

      expect(accountModelMock.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'User account found successfully',
        data: mockAccount,
      });
    });

    it('should create account when not found but defaults provided', async () => {
      accountModelMock.findOne.mockResolvedValue(null);

      const createdAccount = { ...mockAccount };
      accountModelMock.create.mockResolvedValue(createdAccount);

      const defaults = {
        name: 'John Doe',
        email: 'john@example.com',
        avatarUrl: 'http://example.com/avatar.png',
      };

      const result = await service.findOne(mockUserId, defaults);

      expect(accountModelMock.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(accountModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: defaults.name,
          email: defaults.email,
          avatarUrl: defaults.avatarUrl,
        }),
      );
      expect(result).toEqual({
        message: 'User account found successfully',
        data: createdAccount,
      });
    });

    it('should throw RpcException when not found and no defaults', async () => {
      accountModelMock.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUserId)).rejects.toThrow(RpcException);
    });
  });

  describe('update', () => {
    it('should update account and return updated data', async () => {
      const updated = { ...mockAccount, name: 'New Name' };
      accountModelMock.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updated),
      } as any);

      const dto = { name: 'New Name' } as UpdateAccountDto;
      const result = await service.update(mockUserId, dto);

      expect(accountModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: mockUserId },
        { $set: dto },
        { upsert: true, new: true, runValidators: true },
      );
      expect(result).toEqual({
        message: 'User account updated successfully',
        data: updated,
      });
    });

    it('should throw RpcException when update returns null', async () => {
      accountModelMock.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.update(mockUserId, { name: 'New Name' } as UpdateAccountDto),
      ).rejects.toThrow(RpcException);
    });
  });
});
