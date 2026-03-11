import { Test, TestingModule } from '@nestjs/testing';
import { EnrollController } from './enroll.controller';
import { EnrollService } from './enroll.service';

describe('EnrollController', () => {
  let controller: EnrollController;
  let enrollService: EnrollService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollController],
      providers: [
        {
          provide: EnrollService,
          useValue: {
            enroll: jest.fn(),
            getMyEnrollments: jest.fn(),
            getEnrollment: jest.fn(),
            updateProgress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EnrollController>(EnrollController);
    enrollService = module.get<EnrollService>(EnrollService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(enrollService).toBeDefined();
  });
});
