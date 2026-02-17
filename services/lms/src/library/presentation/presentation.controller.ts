import { Controller, Post, Body, Patch, Param, Delete, Get, Query } from '@nestjs/common';
import { PresentationService } from './presentation.service';
import { CreatePresentationDto , UpdatePresentationDto, PublishPresentationDto} from './dto/presentition.dto';


@Controller('/library/presentation')
export class PresentationController {
  constructor(private readonly service: PresentationService) {}

  @Post('createPresentation')
  create(@Body() dto: CreatePresentationDto) {
    return this.service.create(dto, 'USER_ID_TEMP'); // AUTH LATER
  }

  @Patch('updatePresentation/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePresentationDto) {
    return this.service.update(id, dto, 'USER_ID_TEMP');
  }

  @Patch('publishPresentation/:id')
  publish(@Param('id') id: string, @Body() dto: PublishPresentationDto) {
    return this.service.publish(id, dto, 'USER_ID_TEMP');
  }

  @Delete('deletePresentation/:presentationId')
  delete(@Param('presentationId') presentationId: string) {
    return this.service.delete(presentationId, 'USER_ID_TEMP');
  }

  @Get('getAllPresentations')
  getAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('getPresentationById/:presentationId')
  getById(@Param('presentationId') presentationId: string) {
    return this.service.findById(presentationId);
  }

  @Get(':presentationId/content')
  getContent(@Param('presentationId') presentationId: string) {
    return this.service.getContent(presentationId);
  }
}
