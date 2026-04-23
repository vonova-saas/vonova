import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { GetAllByTypeQuery, GetTopicsQuery } from './library.service';
import { LibraryService } from './library.service';

@Controller()
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @MessagePattern({ cmd: 'library.getAllByType' })
  async getAllByType(@Payload() query: GetAllByTypeQuery) {
    return this.libraryService.getAllByType(query);
  }

  @MessagePattern({ cmd: 'library.getTopics' })
  async getTopics(@Payload() query: GetTopicsQuery) {
    return this.libraryService.getTopics(query);
  }

  @MessagePattern({ cmd: 'library.getTotalMaterials' })
  async getTotalMaterials() {
    return this.libraryService.getTotalMaterials();
  }
}
