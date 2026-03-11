import { Test, TestingModule } from '@nestjs/testing';
import { ReaderController } from './reader.controller';
import { ReaderService } from './reader.service';

describe('ReaderController', () => {
  let controller: ReaderController;
  let readerService: ReaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReaderController],
      providers: [
        {
          provide: ReaderService,
          useValue: {
            getBookContent: jest.fn(),
            getGuideContent: jest.fn(),
            getPresentationContent: jest.fn(),
            updateBookProgress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReaderController>(ReaderController);
    readerService = module.get<ReaderService>(ReaderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(readerService).toBeDefined();
  });
});
