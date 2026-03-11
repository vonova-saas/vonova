import { Test, TestingModule } from '@nestjs/testing';
import { GuideService } from './guide.service';
import { getModelToken } from '@nestjs/mongoose';
import { Guide } from '../schema/guide.schema';
import { LibraryAsset } from '../schema/library-asset.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

describe('GuideService', () => {
  let service: GuideService;
  let s3Service: S3Service;
  let guideModel: any;
  let libraryAssetModel: any;

  beforeEach(async () => {
    const mockS3Service = {
      generatePresignedUrl: jest.fn(),
      deleteObject: jest.fn(),
    };

    const mockGuideModel = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuideService,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: getModelToken(Guide.name),
          useValue: mockGuideModel,
        },
        {
          provide: getModelToken(LibraryAsset.name),
          useValue: mockLibraryAssetModel,
        },
      ],
    }).compile();

    service = module.get<GuideService>(GuideService);
    s3Service = module.get<S3Service>(S3Service);
    guideModel = module.get(getModelToken(Guide.name));
    libraryAssetModel = module.get(getModelToken(LibraryAsset.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(s3Service).toBeDefined();
    expect(guideModel).toBeDefined();
    expect(libraryAssetModel).toBeDefined();
  });
});
