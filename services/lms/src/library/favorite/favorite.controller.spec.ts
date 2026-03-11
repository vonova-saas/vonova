import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';

describe('FavoriteController', () => {
  let controller: FavoriteController;
  let favoriteService: FavoriteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoriteController],
      providers: [
        {
          provide: FavoriteService,
          useValue: {
            addToFavorites: jest.fn(),
            removeFromFavorites: jest.fn(),
            getMyFavorites: jest.fn(),
            isFavorited: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FavoriteController>(FavoriteController);
    favoriteService = module.get<FavoriteService>(FavoriteService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(favoriteService).toBeDefined();
  });
});
