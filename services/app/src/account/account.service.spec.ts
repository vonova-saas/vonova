import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../auth/schema/user.schema';
import { RpcException } from '@nestjs/microservices';
import { UpdateAccountDto } from './dto/update-account.dto';

describe('AccountService', () => {
  let service: AccountService;
  let userModelMock: {
    findById: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockUser = {
    _id: mockUserId,
    name: 'John Doe',
    email: 'john@example.com',
    profilePictureUrl: null,
    bio: null,
    dateOfBirth: null,
    address: null,
  };

  beforeEach(async () => {
    userModelMock = {
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getModelToken(User.name),
          useValue: userModelMock,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return existing user account', async () => {
      userModelMock.findById.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUserId);

      expect(userModelMock.findById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        message: 'User account found successfully',
        data: {
          _id: mockUser._id,
          userId: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          avatarUrl: mockUser.profilePictureUrl,
          bio: mockUser.bio || '',
          dateOfBirth: mockUser.dateOfBirth || null,
          address: mockUser.address || '',
        },
      });
    });

    it('should throw RpcException when user not found', async () => {
      userModelMock.findById.mockResolvedValue(null);

      await expect(service.findOne(mockUserId)).rejects.toThrow(RpcException);
    });
  });

  describe('update', () => {
    it('should update user account and return updated data', async () => {
      const updatedUser = { ...mockUser, name: 'New Name' };
      userModelMock.findById.mockResolvedValue(mockUser);
      userModelMock.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUser),
      } as any);

      const dto = { name: 'New Name' } as UpdateAccountDto;
      const result = await service.update(mockUserId, dto);

      expect(userModelMock.findById).toHaveBeenCalledWith(mockUserId);
      expect(userModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockUserId },
        {
          $set: {
            name: 'New Name',
          },
        },
        { new: true, runValidators: true },
      );
      expect(result).toEqual({
        message: 'User account updated successfully',
        data: {
          _id: updatedUser._id,
          userId: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatarUrl: updatedUser.profilePictureUrl,
          bio: updatedUser.bio || '',
          dateOfBirth: updatedUser.dateOfBirth || null,
          address: updatedUser.address || '',
        },
      });
    });

    it('should throw RpcException when user not found for update', async () => {
      userModelMock.findById.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, { name: 'New Name' } as UpdateAccountDto),
      ).rejects.toThrow(RpcException);
    });

    it('should update only provided fields', async () => {
      const updatedUser = {
        ...mockUser,
        profilePictureUrl: 'new-avatar.jpg',
        bio: 'New bio',
      };
      userModelMock.findById.mockResolvedValue(mockUser);
      userModelMock.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUser),
      } as any);

      const dto = {
        avatarUrl: 'new-avatar.jpg',
        bio: 'New bio',
      } as UpdateAccountDto;
      const result = await service.update(mockUserId, dto);

      expect(userModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockUserId },
        {
          $set: {
            profilePictureUrl: 'new-avatar.jpg',
            bio: 'New bio',
          },
        },
        { new: true, runValidators: true },
      );
      expect(result.data.avatarUrl).toBe('new-avatar.jpg');
      expect(result.data.bio).toBe('New bio');
    });
  });
});
