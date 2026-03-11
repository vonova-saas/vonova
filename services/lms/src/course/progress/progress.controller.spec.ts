import { Test, TestingModule } from '@nestjs/testing';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

describe('ProgressController', () => {
  let controller: ProgressController;
  let progressService: ProgressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        {
          provide: ProgressService,
          useValue: {
            markLessonComplete: jest.fn(),
            getLessonProgress: jest.fn(),
            getCourseProgress: jest.fn(),
            resetLessonProgress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
    progressService = module.get<ProgressService>(ProgressService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(progressService).toBeDefined();
  });
});
