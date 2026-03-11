import { Test, TestingModule } from '@nestjs/testing';
import { PresentationService } from './presentation.service';
import { getModelToken } from '@nestjs/mongoose';
import { Presentation } from '../schema/presentation.schema';
import { LibraryAsset } from '../schema/library-asset.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

describe('PresentationService', () => {
  let service: PresentationService;
  let presentationModel: any;
  let libraryAssetModel: any;
  let s3Service: S3Service;

  beforeEach(async () => {
    const mockPresentationModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    const mockLibraryAssetModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const mockS3Service = {
      generatePresignedUrl: jest.fn(),
      deleteObject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresentationService,
        {
          provide: getModelToken(Presentation.name),
          useValue: mockPresentationModel,
        },
        {
          provide: getModelToken(LibraryAsset.name),
          useValue: mockLibraryAssetModel,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<PresentationService>(PresentationService);
    presentationModel = module.get(getModelToken(Presentation.name));
    libraryAssetModel = module.get(getModelToken(LibraryAsset.name));
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(presentationModel).toBeDefined();
    expect(libraryAssetModel).toBeDefined();
    expect(s3Service).toBeDefined();
  });
});
