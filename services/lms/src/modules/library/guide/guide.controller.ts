import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  Query 
} from '@nestjs/common';
import { CreateGuideDto, UpdateGuideDto, PublishGuideDto } from './dto/guide.dto';
import { GuideService } from './guide.service';

@Controller('library/guides')
export class GuideController {
  constructor(private readonly guideService: GuideService) {}

  
  @Post()
  async createGuide(@Body() dto: CreateGuideDto) {
    return this.guideService.createGuideService(dto);
  }


  @Get()
  async listGuides(
    @Query('q') q?: string,
    @Query('topics') topics?: string,
    @Query('level') level?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const topicsArray = topics ? topics.split(',') : undefined;
    return this.guideService.listGuidesService({
      q,
      topics: topicsArray,
      level,
      sort,
      page,
      limit,
      status,
    });
  }

  
  @Get(':id')
  async getGuideById(@Param('id') id: string) {
    return this.guideService.getGuideByIdService(id);
  }

  @Get('slug/:slug')
  async getGuideBySlug(@Param('slug') slug: string) {
    return this.guideService.getGuideBySlugService(slug);
  }

  
  @Patch(':id')
  async updateGuide(@Param('id') id: string, @Body() dto: UpdateGuideDto) {
    return this.guideService.updateGuideService(id, dto);
  }


  @Patch(':id/publish')
  async publishGuide(@Param('id') id: string, @Body() dto: PublishGuideDto) {
    return this.guideService.publishGuideService(id, dto.status);
  }

  
  @Delete(':id')
  async deleteGuide(@Param('id') id: string) {
    return this.guideService.deleteGuideService(id);
  }
}
