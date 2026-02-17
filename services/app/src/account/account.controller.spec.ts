import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';

describe('AccountController', () => {
  let controller: AccountController;
  let accountServiceMock: {
    findOne: jest.Mock;
    update: jest.Mock;
  };

  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    accountServiceMock = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: accountServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should delegate to accountService.findOne', async () => {
      const expected = {
        message: 'User account found successfully',
        data: { id: mockUserId },
      };
      accountServiceMock.findOne.mockResolvedValue(expected);

      // controller.findOne uses @Param, here we just pass the id directly
      const result = await controller.findOne(mockUserId);

      expect(accountServiceMock.findOne).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should delegate to accountService.update', async () => {
      const dto = { name: 'Updated' } as UpdateAccountDto;
      const expected = {
        message: 'User account updated successfully',
        data: { id: mockUserId, name: 'Updated' },
      };
      accountServiceMock.update.mockResolvedValue(expected);

      const result = await controller.update(mockUserId, dto);

      expect(accountServiceMock.update).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual(expected);
    });
  });
});
