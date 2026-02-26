import { Controller, Post, Body, Patch, Param, Delete, Get, Query, UseGuards, Request } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PresentationGatewayService } from './presentation.gateway.service';
import { CreatePresentationDto, UpdatePresentationDto, PublishPresentationDto } from './dto/presentation.dto';

@Controller('api/v1/lms/library/presentation')
@UseGuards(JwtAuthGuard)
export class PresentationGatewayController {
  constructor(private readonly presentationService: PresentationGatewayService) {}

  @Post('createPresentation')
  async create(@Body() dto: CreatePresentationDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.presentationService.create(dto, userId));
  }

  @Patch('updatePresentation/:id')
  async update(@Param('id') id: string, @Body() dto: UpdatePresentationDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.presentationService.update(id, dto, userId));
  }

  @Patch('publishPresentation/:id')
  async publish(@Param('id') id: string, @Body() dto: PublishPresentationDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.presentationService.publish(id, dto, userId));
  }

  @Delete('deletePresentation/:presentationId')
  async delete(@Param('presentationId') presentationId: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.presentationService.delete(presentationId, userId));
  }

  @Get('getAllPresentations')
  async getAll(@Query() query: any) {
    return firstValueFrom(this.presentationService.getAll(query));
  }

  @Get('getPresentationById/:presentationId')
  async getById(@Param('presentationId') presentationId: string) {
    return firstValueFrom(this.presentationService.getById(presentationId));
  }

  @Get(':presentationId/content')
  async getContent(@Param('presentationId') presentationId: string) {
    return firstValueFrom(this.presentationService.getContent(presentationId));
  }
}
