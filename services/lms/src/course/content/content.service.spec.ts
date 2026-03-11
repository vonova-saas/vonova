import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { getModelToken } from '@nestjs/mongoose';
import { Course } from '../course/schema/course.schema';
import { Chapter } from '../chapter/schema/chapter.schema';
import { Lesson } from '../lesson/schema/lesson.schema';
import { Asset } from './schema/asset.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

describe('ContentService', () => {
  let service: ContentService;
  let courseModel: any;
  let chapterModel: any;
  let lessonModel: any;
  let assetModel: any;
  let s3Service: S3Service;

  beforeEach(async () => {
    const mockCourseModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const mockChapterModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const mockLessonModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const mockAssetModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
    };

    const mockS3Service = {
      generatePresignedUrl: jest.fn(),
      deleteObject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: getModelToken(Course.name),
          useValue: mockCourseModel,
        },
        {
          provide: getModelToken(Chapter.name),
          useValue: mockChapterModel,
        },
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
        },
        {
          provide: getModelToken(Asset.name),
          useValue: mockAssetModel,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    courseModel = module.get(getModelToken(Course.name));
    chapterModel = module.get(getModelToken(Chapter.name));
    lessonModel = module.get(getModelToken(Lesson.name));
    assetModel = module.get(getModelToken(Asset.name));
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(courseModel).toBeDefined();
    expect(chapterModel).toBeDefined();
    expect(lessonModel).toBeDefined();
    expect(assetModel).toBeDefined();
    expect(s3Service).toBeDefined();
  });
});
