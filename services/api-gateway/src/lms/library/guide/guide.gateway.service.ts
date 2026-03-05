import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateGuideDto,
  UpdateGuideDto,
  PublishGuideDto,
} from './dto/guide.dto';

@Injectable()
export class GuideGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createGuide(dto: CreateGuideDto) {
    return this.client.send({ cmd: 'library.guides.create' }, { dto });
  }

  listGuides(query: any) {
    const topicsArray = query.topics ? query.topics.split(',') : undefined;
    return this.client.send(
      { cmd: 'library.guides.getAll' },
      { ...query, topics: topicsArray },
    );
  }

  getGuideById(id: string) {
    return this.client.send({ cmd: 'library.guides.getById' }, { id });
  }

  getGuideBySlug(slug: string) {
    return this.client.send({ cmd: 'library.guides.getBySlug' }, { slug });
  }

  updateGuide(id: string, dto: UpdateGuideDto) {
    return this.client.send({ cmd: 'library.guides.update' }, { id, dto });
  }

  publishGuide(id: string, dto: PublishGuideDto) {
    return this.client.send({ cmd: 'library.guides.publish' }, { id, dto });
  }

  deleteGuide(id: string) {
    return this.client.send({ cmd: 'library.guides.delete' }, { id });
  }
}
