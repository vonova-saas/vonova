import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from './course.service';
import { getModelToken } from '@nestjs/mongoose';
import { Course } from './schema/course.schema';
import { Chapter } from '../chapter/schema/chapter.schema';
import { Lesson } from '../lesson/schema/lesson.schema';

describe('CourseService', () => {
  let service: CourseService;
  let courseModel: any;
  let chapterModel: any;
  let lessonModel: any;

  beforeEach(async () => {
    const mockCourseModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
    };

    const mockChapterModel = {
      deleteMany: jest.fn(),
    };

    const mockLessonModel = {
      deleteMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
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
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    courseModel = module.get(getModelToken(Course.name));
    chapterModel = module.get(getModelToken(Chapter.name));
    lessonModel = module.get(getModelToken(Lesson.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(courseModel).toBeDefined();
    expect(chapterModel).toBeDefined();
    expect(lessonModel).toBeDefined();
  });
});
