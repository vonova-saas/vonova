import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateGuideDto,
  UpdateGuideDto,
  PublishGuideDto,
} from './dto/guide.dto';
import { GuideService } from './guide.service';

@Controller()
export class GuideController {
  constructor(private readonly guideService: GuideService) {}

  @MessagePattern({ cmd: 'library.guides.create' })
  async createGuide(@Payload() data: { dto: CreateGuideDto }) {
    const { dto } = data;
    if (!dto) throw new Error('dto is required');

    return this.guideService.createGuideService(dto);
  }

  @MessagePattern({ cmd: 'library.guides.getAll' })
  async listGuides(
    @Payload()
    data: {
      q?: string;
      topics?: string;
      level?: string;
      sort?: string;
      page?: number;
      limit?: number;
      status?: string;
    },
  ) {
    const { q, topics, level, sort, page, limit, status } = data || {};
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

  @MessagePattern({ cmd: 'library.guides.getById' })
  async getGuideById(@Payload() data: { id: string }) {
    const { id } = data;
    if (!id) throw new Error('id is required');

    return this.guideService.getGuideByIdService(id);
  }

  @MessagePattern({ cmd: 'library.guides.getBySlug' })
  async getGuideBySlug(@Payload() data: { slug: string }) {
    const { slug } = data;
    if (!slug) throw new Error('slug is required');

    return this.guideService.getGuideBySlugService(slug);
  }

  @MessagePattern({ cmd: 'library.guides.update' })
  async updateGuide(@Payload() data: { id: string; dto: UpdateGuideDto }) {
    const { id, dto } = data;
    if (!id || !dto) throw new Error('id and dto are required');

    return this.guideService.updateGuideService(id, dto);
  }

  @MessagePattern({ cmd: 'library.guides.publish' })
  async publishGuide(@Payload() data: { id: string; dto: PublishGuideDto }) {
    const { id, dto } = data;
    if (!id || !dto) throw new Error('id and dto are required');

    return this.guideService.publishGuideService(id, dto.status);
  }

  @MessagePattern({ cmd: 'library.guides.delete' })
  async deleteGuide(@Payload() data: { id: string }) {
    const { id } = data;
    if (!id) throw new Error('id is required');

    return this.guideService.deleteGuideService(id);
  }
}
