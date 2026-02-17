/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserSettings } from './schema/settings.schema';
import { RpcException } from '@nestjs/microservices';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

describe('SettingsService', () => {
  let service: SettingsService;
  // Use a jest.fn() so it can be called with `new` like a real Mongoose model
  let settingsModelMock: jest.Mock & {
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    deleteOne: jest.Mock;
  };

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockSettings = {
    _id: '507f1f77bcf86cd799439012',
    userId: mockUserId,
    theme: 'dark',
    language: 'en',
    type: 'all',
    communication_emails: false,
    marketing_emails: false,
    social_emails: false,
    security_emails: true,
    mobile: false,
    lastUpdated: new Date(),
    isActive: true,
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    settingsModelMock = Object.assign(
      jest.fn().mockImplementation((dto) => ({
        ...dto,
        save: jest.fn().mockResolvedValue({
          ...dto,
          _id: '507f1f77bcf86cd799439012',
        }),
      })),
      {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        deleteOne: jest.fn(),
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getModelToken(UserSettings.name),
          useValue: settingsModelMock,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create settings with default values merged with dto', async () => {
      const dto: CreateSettingDto = {
        userId: mockUserId,
        theme: 'light',
        language: 'fr',
        type: 'mentions',
        communication_emails: true,
        marketing_emails: false,
        social_emails: true,
        security_emails: false,
        mobile: true,
      };

      const mockInstance = {
        ...dto,
        theme: 'light',
        language: 'fr',
        save: jest
          .fn()
          .mockResolvedValue({ _id: '507f1f77bcf86cd799439012', ...dto }),
      };
      settingsModelMock.mockImplementation(() => mockInstance);

      const result = await service.create(dto);

      // We just assert that the merged payload contains the DTO fields
      expect(settingsModelMock).toHaveBeenCalledWith(
        expect.objectContaining(dto),
      );
      expect(result).toEqual({
        message: 'Settings created successfully',
        data: { _id: '507f1f77bcf86cd799439012', ...dto },
      });
    });

    it('should throw RpcException on error', async () => {
      const dto = { userId: mockUserId } as any;
      settingsModelMock.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.create(dto)).rejects.toThrow(RpcException);
    });
  });

  describe('findOne', () => {
    it('should return settings for existing user', async () => {
      settingsModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSettings),
      });

      const result = await service.findOne(mockUserId);

      expect(settingsModelMock.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'Settings found successfully',
        data: mockSettings,
      });
    });

    it('should create default settings when none exist', async () => {
      settingsModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const expectedResult = {
        message: 'Settings created successfully',
        data: { _id: '507f1f77bcf86cd799439012' },
      } as const;

      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(expectedResult as any);

      const result = await service.findOne(mockUserId);

      expect(settingsModelMock.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update existing settings', async () => {
      const updatedSettings = { ...mockSettings, theme: 'light' };
      settingsModelMock.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedSettings),
      });

      const dto = { theme: 'light' } as UpdateSettingDto;
      const result = await service.update(mockUserId, dto);

      expect(settingsModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: mockUserId },
        dto,
        { new: true },
      );
      expect(result).toEqual({
        message: 'Settings updated successfully',
        data: updatedSettings,
      });
    });

    it('should create settings if none exist during update', async () => {
      settingsModelMock.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const expectedResult = {
        message: 'Settings created successfully',
        data: { _id: '507f1f77bcf86cd799439012' },
      } as const;

      const createSpy = jest
        .spyOn(service, 'create')
        .mockResolvedValue(expectedResult as any);

      const dto = { theme: 'light' } as UpdateSettingDto;
      const result = await service.update(mockUserId, dto);

      expect(settingsModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: mockUserId },
        dto,
        { new: true },
      );
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete settings', async () => {
      settingsModelMock.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      const result = await service.remove(mockUserId);

      expect(settingsModelMock.deleteOne).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'Settings deleted successfully',
      });
    });

    it('should throw RpcException if settings not found', async () => {
      settingsModelMock.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      });

      await expect(service.remove(mockUserId)).rejects.toThrow(RpcException);
    });
  });
});
