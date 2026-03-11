import { Test, TestingModule } from '@nestjs/testing';
import { EnrollService } from './enroll.service';
import { getModelToken } from '@nestjs/mongoose';
import { Enrollment } from './schema/enrollment.schema';
import { Course } from '../course/schema/course.schema';
import { Lesson } from '../lesson/schema/lesson.schema';

describe('EnrollService', () => {
  let service: EnrollService;
  let enrollmentModel: any;
  let courseModel: any;
  let lessonModel: any;

  beforeEach(async () => {
    const mockEnrollmentModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    const mockCourseModel = {
      findById: jest.fn(),
    };

    const mockLessonModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollService,
        {
          provide: getModelToken(Enrollment.name),
          useValue: mockEnrollmentModel,
        },
        {
          provide: getModelToken(Course.name),
          useValue: mockCourseModel,
        },
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
        },
      ],
    }).compile();

    service = module.get<EnrollService>(EnrollService);
    enrollmentModel = module.get(getModelToken(Enrollment.name));
    courseModel = module.get(getModelToken(Course.name));
    lessonModel = module.get(getModelToken(Lesson.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(enrollmentModel).toBeDefined();
    expect(courseModel).toBeDefined();
    expect(lessonModel).toBeDefined();
  });
});
