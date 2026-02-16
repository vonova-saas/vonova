import { Test, TestingModule } from '@nestjs/testing';
import { SupoortController } from './supoort.controller';

describe('SupoortController', () => {
  let controller: SupoortController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupoortController],
    }).compile();

    controller = module.get<SupoortController>(SupoortController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
