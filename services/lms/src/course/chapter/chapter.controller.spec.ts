import { Test, TestingModule } from '@nestjs/testing';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';

describe('ChapterController', () => {
  let controller: ChapterController;
  let chapterService: ChapterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChapterController],
      providers: [
        {
          provide: ChapterService,
          useValue: {
            createChapter: jest.fn(),
            getChaptersByCourse: jest.fn(),
            getChapterById: jest.fn(),
            updateChapter: jest.fn(),
            deleteChapter: jest.fn(),
            reorderChapters: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ChapterController>(ChapterController);
    chapterService = module.get<ChapterService>(ChapterService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(chapterService).toBeDefined();
  });
});
