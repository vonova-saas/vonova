import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateGuideDto,
  UpdateGuideDto,
  PublishGuideDto,
  GetGuidesQueryDto,
} from './dto/guide.dto';
import { GuideService } from './guide.service';

@Controller()
export class GuideController {
  constructor(private readonly guideService: GuideService) {}

  @MessagePattern({ cmd: 'library.guides.create' })
  async createGuide(@Payload() data: { dto: CreateGuideDto; userId?: string; user?: { id?: string; sub?: string; _id?: string } }) {
    const { dto, userId, user } = data;
    if (!dto) throw new Error('dto is required');
    
    // Extract userId from multiple possible sources
    const createdBy = userId || user?.id || user?.sub || user?._id;
    if (!createdBy) throw new Error('User identification is required');

    return this.guideService.createGuideService(dto, createdBy);
  }

  @MessagePattern({ cmd: 'library.guides.getAll' })
  async listGuides(
    @Payload()
    data: GetGuidesQueryDto & { topics?: string[]; page?: number; limit?: number },
  ) {
    const { q, topics, level, sort, page, limit, status, userRole, userId } = data || {};
    const topicsArray = topics ? topics.split(',') : undefined;

    return this.guideService.listGuidesService({
      q,
      topics: topicsArray,
      level,
      sort,
      page,
      limit,
      status,
      userRole,
      userId,
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
  async updateGuide(@Payload() data: { id: string; dto: UpdateGuideDto; userId?: string; user?: { id?: string; sub?: string; _id?: string } }) {
    const { id, dto, userId, user } = data;
    if (!id || !dto) throw new Error('id and dto are required');
    
    // Extract userId from multiple possible sources
    const createdBy = userId || user?.id || user?.sub || user?._id;
    if (!createdBy) throw new Error('User identification is required');

    return this.guideService.updateGuideService(id, dto, createdBy);
  }

  @MessagePattern({ cmd: 'library.guides.publish' })
  async publishGuide(@Payload() data: { id: string; dto: PublishGuideDto; userId?: string; user?: { id?: string; sub?: string; _id?: string } }) {
    const { id, dto, userId, user } = data;
    if (!id || !dto) throw new Error('id and dto are required');
    
    // Extract userId from multiple possible sources
    const createdBy = userId || user?.id || user?.sub || user?._id;
    if (!createdBy) throw new Error('User identification is required');

    return this.guideService.publishGuideService(id, dto, createdBy);
  }

  @MessagePattern({ cmd: 'library.guides.delete' })
  async deleteGuide(@Payload() data: { id: string; userId?: string; user?: { id?: string; sub?: string; _id?: string } }) {
    const { id, userId, user } = data;
    if (!id) throw new Error('id is required');
    
    // Extract userId from multiple possible sources
    const createdBy = userId || user?.id || user?.sub || user?._id;
    if (!createdBy) throw new Error('User identification is required');

    return this.guideService.deleteGuideService(id, createdBy);
  }

  @MessagePattern({ cmd: 'library.guides.getAllLinks' })
  async getAllGuideLinks() {
    return this.guideService.getAllGuideLinksService();
  }
}
