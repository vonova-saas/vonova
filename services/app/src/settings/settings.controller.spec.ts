/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

describe('SettingsController', () => {
  let controller: SettingsController;
  let mockSettingsService: any;

  const mockUserId = '507f1f77bcf86cd799439011';

  const mockUpdateDto: UpdateSettingDto = {
    theme: 'light',
  };

  beforeEach(async () => {
    mockSettingsService = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should call settingsService.findOne with userId', async () => {
      const expectedResult = {
        message: 'Settings found successfully',
        data: { userId: mockUserId, theme: 'dark' },
      };
      mockSettingsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockUserId);

      expect(mockSettingsService.findOne).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call settingsService.update with userId and dto', async () => {
      const expectedResult = {
        message: 'Settings updated successfully',
        data: { userId: mockUserId, theme: 'light' },
      };
      mockSettingsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(mockUserId, mockUpdateDto);

      expect(mockSettingsService.update).toHaveBeenCalledWith(
        mockUserId,
        mockUpdateDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call settingsService.remove with userId', async () => {
      const expectedResult = { message: 'Settings deleted successfully' };
      mockSettingsService.remove.mockResolvedValue(expectedResult);

      await controller.remove(mockUserId);

      expect(mockSettingsService.remove).toHaveBeenCalledWith(mockUserId);
    });
  });
});
