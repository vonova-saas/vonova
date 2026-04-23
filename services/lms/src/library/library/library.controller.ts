import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { GetAllByTypeQuery, GetTopicsQuery } from './library.service';
import { LibraryService } from './library.service';

@ApiTags('Library Microservice')
@Controller()
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @ApiOperation({
    summary: 'Get all library items by type',
    description: 'Retrieves all library items (books, guides, presentations) with optional filtering by type. If no type is specified, returns all items from all collections.',
  })
  @MessagePattern({ cmd: 'library.getAllByType' })
  async getAllByType(@Payload() query: GetAllByTypeQuery) {
    return this.libraryService.getAllByType(query);
  }

  @ApiOperation({
    summary: 'Get available topics',
    description: 'Retrieves all available library topics with optional filtering by content type and other parameters.',
  })
  @MessagePattern({ cmd: 'library.getTopics' })
  async getTopics(@Payload() query: GetTopicsQuery) {
    return this.libraryService.getTopics(query);
  }

  @ApiOperation({
    summary: 'Get total count of all materials',
    description: 'Retrieves total count of books, guides, and presentations in the library with percentage breakdown.',
  })
  @MessagePattern({ cmd: 'library.getTotalMaterials' })
  async getTotalMaterials() {
    return this.libraryService.getTotalMaterials();
  }
}
