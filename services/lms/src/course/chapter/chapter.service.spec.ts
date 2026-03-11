import { Test, TestingModule } from '@nestjs/testing';
import { ChapterService } from './chapter.service';
import { getModelToken } from '@nestjs/mongoose';
import { Chapter } from './schema/chapter.schema';
import { Course } from '../course/schema/course.schema';

describe('ChapterService', () => {
  let service: ChapterService;
  let chapterModel: any;
  let courseModel: any;

  beforeEach(async () => {
    const mockChapterModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      bulkWrite: jest.fn(),
    };

    const mockCourseModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChapterService,
        {
          provide: getModelToken(Chapter.name),
          useValue: mockChapterModel,
        },
        {
          provide: getModelToken(Course.name),
          useValue: mockCourseModel,
        },
      ],
    }).compile();

    service = module.get<ChapterService>(ChapterService);
    chapterModel = module.get(getModelToken(Chapter.name));
    courseModel = module.get(getModelToken(Course.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(chapterModel).toBeDefined();
    expect(courseModel).toBeDefined();
  });
});
