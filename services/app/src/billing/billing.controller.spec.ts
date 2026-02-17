/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { UpdateBillingDto } from './dto/update-billing.dto';

describe('BillingController', () => {
  let controller: BillingController;
  let billingServiceMock: {
    findOne: jest.Mock;
    update: jest.Mock;
  };

  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    billingServiceMock = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        {
          provide: BillingService,
          useValue: billingServiceMock,
        },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should delegate to billingService.findOne', async () => {
      const expected = {
        message: 'User billing fetched successfully',
        data: { userId: mockUserId },
      };
      billingServiceMock.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUserId as any);

      expect(billingServiceMock.findOne).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should delegate to billingService.update', async () => {
      const dto = { plan: 'pro' } as UpdateBillingDto;
      const expected = {
        message: 'User billing updated successfully',
        data: { userId: mockUserId, plan: 'pro' },
      };
      billingServiceMock.update.mockResolvedValue(expected);

      const result = await controller.update(mockUserId as any, dto as any);

      expect(billingServiceMock.update).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual(expected);
    });
  });
});
