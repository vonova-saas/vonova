import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GuideGatewayService } from './guide.gateway.service';
import { CreateGuideDto, UpdateGuideDto, PublishGuideDto } from './dto/guide.dto';

@Controller('api/v1/lms/library/guides')
@UseGuards(JwtAuthGuard)
export class GuideGatewayController {
  constructor(private readonly guideService: GuideGatewayService) {}

  @Post()
  async createGuide(@Body() dto: CreateGuideDto, @Request() _req: any) {
    return firstValueFrom(this.guideService.createGuide(dto));
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
    return firstValueFrom(this.guideService.listGuides({
      q,
      topics: topicsArray,
      level,
      sort,
      page,
      limit,
      status,
    }));
  }

  @Get(':id')
  async getGuideById(@Param('id') id: string) {
    return firstValueFrom(this.guideService.getGuideById(id));
  }

  @Get('slug/:slug')
  async getGuideBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.guideService.getGuideBySlug(slug));
  }

  @Patch(':id')
  async updateGuide(@Param('id') id: string, @Body() dto: UpdateGuideDto, @Request() _req: any) {
    return firstValueFrom(this.guideService.updateGuide(id, dto));
  }

  @Patch(':id/publish')
  async publishGuide(@Param('id') id: string, @Body() dto: PublishGuideDto, @Request() _req: any) {
    return firstValueFrom(this.guideService.publishGuide(id, dto));
  }

  @Delete(':id')
  async deleteGuide(@Param('id') id: string, @Request() _req: any) {
    return firstValueFrom(this.guideService.deleteGuide(id));
  }
}
