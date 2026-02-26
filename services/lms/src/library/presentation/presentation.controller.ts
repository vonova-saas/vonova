import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PresentationService } from './presentation.service';
import { CreatePresentationDto, UpdatePresentationDto, PublishPresentationDto } from './dto/presentition.dto';

@Controller()
export class PresentationController {
  constructor(private readonly service: PresentationService) {}

  @MessagePattern({ cmd: 'library.presentation.create' })
  create(@Payload() data: { dto: CreatePresentationDto; userId: string }) {
    const { dto, userId } = data;
    if (!dto || !userId) throw new Error('dto and userId are required');

    return this.service.create(dto, userId);
  }

  @MessagePattern({ cmd: 'library.presentation.update' })
  update(@Payload() data: { id: string; dto: UpdatePresentationDto; userId: string }) {
    const { id, dto, userId } = data;
    if (!id || !dto || !userId) throw new Error('id, dto and userId are required');

    return this.service.update(id, dto, userId);
  }

  @MessagePattern({ cmd: 'library.presentation.publish' })
  publish(@Payload() data: { id: string; dto: PublishPresentationDto; userId: string }) {
    const { id, dto, userId } = data;
    if (!id || !dto || !userId) throw new Error('id, dto and userId are required');

    return this.service.publish(id, dto, userId);
  }

  @MessagePattern({ cmd: 'library.presentation.delete' })
  delete(@Payload() data: { presentationId: string; userId: string }) {
    const { presentationId, userId } = data;
    if (!presentationId || !userId) throw new Error('presentationId and userId are required');

    return this.service.delete(presentationId, userId);
  }

  @MessagePattern({ cmd: 'library.presentation.getAll' })
  getAll(@Payload() data: any) {
    return this.service.findAll(data || {});
  }

  @MessagePattern({ cmd: 'library.presentation.getById' })
  getById(@Payload() data: { presentationId: string }) {
    const { presentationId } = data;
    if (!presentationId) throw new Error('presentationId is required');

    return this.service.findById(presentationId);
  }

  @MessagePattern({ cmd: 'library.presentation.getContent' })
  getContent(@Payload() data: { presentationId: string }) {
    const { presentationId } = data;
    if (!presentationId) throw new Error('presentationId is required');

    return this.service.getContent(presentationId);
  }
}