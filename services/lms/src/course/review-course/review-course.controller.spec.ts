import { Test, TestingModule } from '@nestjs/testing';
import { ReviewCourseController } from './review-course.controller';
import { ReviewCourseService } from './review-course.service';

describe('ReviewCourseController', () => {
  let controller: ReviewCourseController;
  let reviewCourseService: ReviewCourseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewCourseController],
      providers: [
        {
          provide: ReviewCourseService,
          useValue: {
            createOrUpdateReview: jest.fn(),
            getCourseReviews: jest.fn(),
            getMyReview: jest.fn(),
            deleteReview: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReviewCourseController>(ReviewCourseController);
    reviewCourseService = module.get<ReviewCourseService>(ReviewCourseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(reviewCourseService).toBeDefined();
  });
});
