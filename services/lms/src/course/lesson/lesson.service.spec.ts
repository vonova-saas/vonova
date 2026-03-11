import { Test, TestingModule } from '@nestjs/testing';
import { LessonService } from './lesson.service';
import { getModelToken } from '@nestjs/mongoose';
import { Lesson } from './schema/lesson.schema';
import { Chapter } from '../chapter/schema/chapter.schema';
import { Course } from '../course/schema/course.schema';
import { S3ConfigService } from './config/s3.config';

describe('LessonService', () => {
  let service: LessonService;
  let lessonModel: any;
  let chapterModel: any;
  let courseModel: any;

  beforeEach(async () => {
    const mockLessonModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      bulkWrite: jest.fn(),
    };

    const mockChapterModel = {
      findById: jest.fn(),
    };

    const mockCourseModel = {
      findById: jest.fn(),
    };

    const mockS3ConfigService = {
      getBucketName: jest.fn().mockReturnValue('test-bucket'),
      getClient: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonService,
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
        },
        {
          provide: getModelToken(Chapter.name),
          useValue: mockChapterModel,
        },
        {
          provide: getModelToken(Course.name),
          useValue: mockCourseModel,
        },
        {
          provide: S3ConfigService,
          useValue: mockS3ConfigService,
        },
      ],
    }).compile();

    service = module.get<LessonService>(LessonService);
    lessonModel = module.get(getModelToken(Lesson.name));
    chapterModel = module.get(getModelToken(Chapter.name));
    courseModel = module.get(getModelToken(Course.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(lessonModel).toBeDefined();
    expect(chapterModel).toBeDefined();
    expect(courseModel).toBeDefined();
  });
});
