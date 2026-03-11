import { Test, TestingModule } from '@nestjs/testing';
import { GuideController } from './guide.controller';
import { GuideService } from './guide.service';

describe('GuideController', () => {
  let controller: GuideController;
  let guideService: GuideService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuideController],
      providers: [
        {
          provide: GuideService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GuideController>(GuideController);
    guideService = module.get<GuideService>(GuideService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(guideService).toBeDefined();
  });
});
