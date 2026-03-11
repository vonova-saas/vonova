import { Test, TestingModule } from '@nestjs/testing';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';

describe('PresentationController', () => {
  let controller: PresentationController;
  let presentationService: PresentationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresentationController],
      providers: [
        {
          provide: PresentationService,
          useValue: {
            createPresentation: jest.fn(),
            getPresentations: jest.fn(),
            getPresentationById: jest.fn(),
            updatePresentation: jest.fn(),
            deletePresentation: jest.fn(),
            publishPresentation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PresentationController>(PresentationController);
    presentationService = module.get<PresentationService>(PresentationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(presentationService).toBeDefined();
  });
});
