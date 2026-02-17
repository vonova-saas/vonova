import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserBilling } from './schema/billing.schema';
import { RpcException } from '@nestjs/microservices';
import { UpdateBillingDto } from './dto/update-billing.dto';

describe('BillingService', () => {
  let service: BillingService;
  let billingModelMock: {
    findOne: jest.Mock;
    create: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockBilling = {
    _id: '507f1f77bcf86cd799439012',
    userId: mockUserId,
    plan: 'basic',
    cardNumber: '4242424242424242',
    nameOfCard: 'John Doe',
    expiryDate: '12/30',
    cvv: '123',
    billingEmail: 'billing@example.com',
    cardAddress: '123 Main St',
    city: 'Cairo',
    country: 'Egypt',
    zipCode: '10001',
  };

  beforeEach(async () => {
    billingModelMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getModelToken(UserBilling.name),
          useValue: billingModelMock,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return existing billing if found', async () => {
      billingModelMock.findOne.mockResolvedValue(mockBilling);

      const result = await service.findOne(mockUserId);

      expect(billingModelMock.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(result).toEqual({
        message: 'User billing fetched successfully',
        data: mockBilling,
      });
    });

    it('should create default billing if not found', async () => {
      billingModelMock.findOne.mockResolvedValue(null);

      const created = { ...mockBilling };
      billingModelMock.create.mockResolvedValue(created);

      const result = await service.findOne(mockUserId);

      expect(billingModelMock.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
      });
      expect(billingModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUserId }),
      );
      expect(result).toEqual({
        message: 'User billing fetched successfully',
        data: created,
      });
    });
  });

  describe('update', () => {
    it('should update billing and return updated data', async () => {
      const updated = { ...mockBilling, plan: 'pro' };
      billingModelMock.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updated),
      } as any);

      const dto = { plan: 'pro' } as UpdateBillingDto;
      const result = await service.update(mockUserId, dto);

      expect(billingModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: mockUserId },
        { $set: dto },
        { new: true, upsert: true },
      );
      expect(result).toEqual({
        message: 'User billing updated successfully',
        data: updated,
      });
    });

    it('should throw RpcException when update result is null', async () => {
      billingModelMock.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.update(mockUserId, { plan: 'pro' } as UpdateBillingDto),
      ).rejects.toThrow(RpcException);
    });
  });
});
