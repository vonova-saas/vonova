import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

interface HealthResponse {
  status?: string;
  service?: string;
  version: string;
  timestamp: string;
}

@Controller()
export class AppController {
  private baseResponse(): Pick<HealthResponse, 'version' | 'timestamp'> {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern({ cmd: 'getLmsHealth' })
  getHealth(): HealthResponse {
    return {
      status: 'Healthy!',
      service: 'LMS Service',
      ...this.baseResponse(),
    };
  }

  @MessagePattern({ cmd: 'getLmsAiHealth' })
  getLmsAiHealth(): HealthResponse {
    return {
      status: 'Healthy!',
      service: 'LMS-AI Service',
      ...this.baseResponse(),
    };
  }
}
