import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { getModelToken } from '@nestjs/mongoose';
import { Book } from '../schema/book/book.schema';
import { Guide } from '../schema/guide.schema';
import { LibraryAsset } from '../schema/library-asset.schema';
import { Presentation } from '../schema/presentation.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

describe('UploadService', () => {
  let service: UploadService;
  let s3Service: S3Service;
  let bookModel: any;
  let guideModel: any;
  let libraryAssetModel: any;
  let presentationModel: any;

  beforeEach(async () => {
    const mockS3Service = {
      generatePresignedUrl: jest.fn(),
      deleteObject: jest.fn(),
    };

    const mockBookModel = {
      findById: jest.fn(),
    };

    const mockGuideModel = {
      findById: jest.fn(),
    };

    const mockLibraryAssetModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const mockPresentationModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: S3Service,
          useValue: mockS3Service,
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
          provide: getModelToken(LibraryAsset.name),
          useValue: mockLibraryAssetModel,
        },
        {
          provide: getModelToken(Presentation.name),
          useValue: mockPresentationModel,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    s3Service = module.get<S3Service>(S3Service);
    bookModel = module.get(getModelToken(Book.name));
    guideModel = module.get(getModelToken(Guide.name));
    libraryAssetModel = module.get(getModelToken(LibraryAsset.name));
    presentationModel = module.get(getModelToken(Presentation.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(s3Service).toBeDefined();
    expect(bookModel).toBeDefined();
    expect(guideModel).toBeDefined();
    expect(libraryAssetModel).toBeDefined();
    expect(presentationModel).toBeDefined();
  });
});
