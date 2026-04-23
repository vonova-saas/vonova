import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreatePresentationDto,
  UpdatePresentationDto,
  PublishPresentationDto,
} from './dto/presentation.dto';

@Injectable()
export class PresentationGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  create(dto: CreatePresentationDto, userId: string) {
    return this.client.send(
      { cmd: 'library.presentation.create' },
      { dto, userId },
    );
  }

  update(id: string, dto: UpdatePresentationDto, userId: string) {
    return this.client.send(
      { cmd: 'library.presentation.update' },
      { id, dto, userId },
    );
  }

  publish(id: string, dto: PublishPresentationDto, userId: string) {
    return this.client.send(
      { cmd: 'library.presentation.publish' },
      { id, dto, userId },
    );
  }

  delete(presentationId: string, userId: string) {
    return this.client.send(
      { cmd: 'library.presentation.delete' },
      { presentationId, userId },
    );
  }

  getAll(query?: any) {
    const queryWithUser = {
      ...query,
      userRole: query?.userRole,
      userId: query?.userId
    };
    return this.client.send(
      { cmd: 'library.presentation.getAll' },
      queryWithUser,
    );
  }

  getById(presentationId: string) {
    return this.client.send(
      { cmd: 'library.presentation.getById' },
      { presentationId },
    );
  }

  getContent(presentationId: string) {
    return this.client.send(
      { cmd: 'library.presentation.getContent' },
      { presentationId },
    );
  }

  getAllLinks() {
    return this.client.send(
      { cmd: 'library.presentation.getAllLinks' },
      {},
    );
  }
}
