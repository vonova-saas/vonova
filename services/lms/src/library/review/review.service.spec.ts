import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { getModelToken } from '@nestjs/mongoose';
import { LibraryReview } from '../schema/review.schema';
import { Book } from '../schema/book/book.schema';
import { Guide } from '../schema/guide.schema';
import { Presentation } from '../schema/presentation.schema';

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewModel: any;
  let bookModel: any;
  let guideModel: any;
  let presentationModel: any;

  beforeEach(async () => {
    const mockReviewModel = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };

    const mockBookModel = {
      updateOne: jest.fn(),
      findById: jest.fn(),
    };

    const mockGuideModel = {
      updateOne: jest.fn(),
      findById: jest.fn(),
    };

    const mockPresentationModel = {
      updateOne: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: getModelToken(LibraryReview.name),
          useValue: mockReviewModel,
        },
        {
          provide: getModelToken(Book.name),
          useValue: mockBookModel,
        },
        {
          provide: getModelToken(Guide.name),
          useValue: mockGuideModel,
        },
        {
          provide: getModelToken(Presentation.name),
          useValue: mockPresentationModel,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    reviewModel = module.get(getModelToken(LibraryReview.name));
    bookModel = module.get(getModelToken(Book.name));
    guideModel = module.get(getModelToken(Guide.name));
    presentationModel = module.get(getModelToken(Presentation.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(reviewModel).toBeDefined();
    expect(bookModel).toBeDefined();
    expect(guideModel).toBeDefined();
    expect(presentationModel).toBeDefined();
  });
});
