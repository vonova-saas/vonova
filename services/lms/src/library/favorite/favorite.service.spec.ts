import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteService } from './favorite.service';
import { getModelToken } from '@nestjs/mongoose';
import { Favorite } from '../schema/favorite.schema';
import { Book } from '../schema/book/book.schema';
import { Guide } from '../schema/guide.schema';
import { Presentation } from '../schema/presentation.schema';

describe('FavoriteService', () => {
  let service: FavoriteService;
  let favoriteModel: any;
  let bookModel: any;
  let guideModel: any;
  let presentationModel: any;

  beforeEach(async () => {
    const mockFavoriteModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    const mockBookModel = {
      findById: jest.fn(),
    };

    const mockGuideModel = {
      findById: jest.fn(),
    };

    const mockPresentationModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        {
          provide: getModelToken(Favorite.name),
          useValue: mockFavoriteModel,
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

    service = module.get<FavoriteService>(FavoriteService);
    favoriteModel = module.get(getModelToken(Favorite.name));
    bookModel = module.get(getModelToken(Book.name));
    guideModel = module.get(getModelToken(Guide.name));
    presentationModel = module.get(getModelToken(Presentation.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(favoriteModel).toBeDefined();
    expect(bookModel).toBeDefined();
    expect(guideModel).toBeDefined();
    expect(presentationModel).toBeDefined();
  });
});
