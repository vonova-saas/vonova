import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { GetAllByTypeQueryDto, GetTopicsQueryDto } from './dto';

@Injectable()
export class LibraryGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async getAllByType(query: GetAllByTypeQueryDto) {
    const pattern = { cmd: 'library.getAllByType' };
    
    // Convert topics from string to array if present
    const payload = {
      ...query,
      topics: query.topics ? query.topics.split(',').map(t => t.trim()) : undefined,
    };

    return firstValueFrom(this.client.send(pattern, payload));
  }

  async getTopics(query: GetTopicsQueryDto) {
    const pattern = { cmd: 'library.getTopics' };
    
    // Convert topics from string to array if present
    const payload = {
      ...query,
      topics: query.topics ? query.topics.split(',').map(t => t.trim()) : undefined,
    };

    return firstValueFrom(this.client.send(pattern, payload));
  }

  async getTotalMaterials() {
    const pattern = { cmd: 'library.getTotalMaterials' };
    return firstValueFrom(this.client.send(pattern, {}));
  }
}
