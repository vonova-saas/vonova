import { Test, TestingModule } from '@nestjs/testing';
import { ReaderService } from './reader.service';
import { getModelToken } from '@nestjs/mongoose';
import { Book } from '../schema/book/book.schema';
import { LibraryAsset } from '../schema/library-asset.schema';
import { Guide } from '../schema/guide.schema';
import { Presentation } from '../schema/presentation.schema';
import { BookProgress } from '../schema/book/book-progress.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

describe('ReaderService', () => {
  let service: ReaderService;
  let bookModel: any;
  let libraryAssetModel: any;
  let guideModel: any;
  let presentationModel: any;
  let bookProgressModel: any;
  let s3Service: S3Service;

  beforeEach(async () => {
    const mockBookModel = {
      findById: jest.fn(),
    };

    const mockLibraryAssetModel = {
      findById: jest.fn(),
    };

    const mockGuideModel = {
      findById: jest.fn(),
    };

    const mockPresentationModel = {
      findById: jest.fn(),
    };

    const mockBookProgressModel = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
    };

    const mockS3Service = {
      generatePresignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReaderService,
        {
          provide: getModelToken(Book.name),
          useValue: mockBookModel,
        },
        {
          provide: getModelToken(LibraryAsset.name),
          useValue: mockLibraryAssetModel,
        },
        {
          provide: getModelToken(Guide.name),
          useValue: mockGuideModel,
        },
        {
          provide: getModelToken(Presentation.name),
          useValue: mockPresentationModel,
        },
        {
          provide: getModelToken(BookProgress.name),
          useValue: mockBookProgressModel,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<ReaderService>(ReaderService);
    bookModel = module.get(getModelToken(Book.name));
    libraryAssetModel = module.get(getModelToken(LibraryAsset.name));
    guideModel = module.get(getModelToken(Guide.name));
    presentationModel = module.get(getModelToken(Presentation.name));
    bookProgressModel = module.get(getModelToken(BookProgress.name));
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(bookModel).toBeDefined();
    expect(libraryAssetModel).toBeDefined();
    expect(guideModel).toBeDefined();
    expect(presentationModel).toBeDefined();
    expect(bookProgressModel).toBeDefined();
    expect(s3Service).toBeDefined();
  });
});
