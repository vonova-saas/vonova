import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      status: "Healthy!",
      service: "LMS Service",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  }
}
