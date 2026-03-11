import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { getModelToken } from '@nestjs/mongoose';
import { LessonProgress } from './schema/lesson-progress.schema';
import { Lesson } from '../lesson/schema/lesson.schema';
import { EnrollService } from '../enroll/enroll.service';

describe('ProgressService', () => {
  let service: ProgressService;
  let lessonProgressModel: any;
  let lessonModel: any;
  let enrollService: EnrollService;

  beforeEach(async () => {
    const mockLessonProgressModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    const mockLessonModel = {
      findById: jest.fn(),
    };

    const mockEnrollService = {
      getEnrollment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getModelToken(LessonProgress.name),
          useValue: mockLessonProgressModel,
        },
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
        },
        {
          provide: EnrollService,
          useValue: mockEnrollService,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    lessonProgressModel = module.get(getModelToken(LessonProgress.name));
    lessonModel = module.get(getModelToken(Lesson.name));
    enrollService = module.get<EnrollService>(EnrollService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(lessonProgressModel).toBeDefined();
    expect(lessonModel).toBeDefined();
    expect(enrollService).toBeDefined();
  });
});
