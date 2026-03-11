import { Test, TestingModule } from '@nestjs/testing';
import { ReviewCourseService } from './review-course.service';
import { getModelToken } from '@nestjs/mongoose';
import { ReviewCourse } from './schema/review-course.schema';
import { Enrollment } from '../enroll/schema/enrollment.schema';
import { Course } from '../course/schema/course.schema';

describe('ReviewCourseService', () => {
  let service: ReviewCourseService;
  let reviewCourseModel: any;
  let enrollmentModel: any;
  let courseModel: any;

  beforeEach(async () => {
    const mockReviewCourseModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };

    const mockEnrollmentModel = {
      findOne: jest.fn(),
    };

    const mockCourseModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewCourseService,
        {
          provide: getModelToken(ReviewCourse.name),
          useValue: mockReviewCourseModel,
        },
        {
          provide: getModelToken(Enrollment.name),
          useValue: mockEnrollmentModel,
        },
        {
          provide: getModelToken(Course.name),
          useValue: mockCourseModel,
        },
      ],
    }).compile();

    service = module.get<ReviewCourseService>(ReviewCourseService);
    reviewCourseModel = module.get(getModelToken(ReviewCourse.name));
    enrollmentModel = module.get(getModelToken(Enrollment.name));
    courseModel = module.get(getModelToken(Course.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(reviewCourseModel).toBeDefined();
    expect(enrollmentModel).toBeDefined();
    expect(courseModel).toBeDefined();
  });
});
