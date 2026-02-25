import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RoadmapGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  generateRoadmap(data: any) {
    return this.client.send({ cmd: 'lms.ai.roadmap.generate' }, data);
  }

  getRoadmapById(data: {
    roadmapId: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
  }) {
    return this.client.send({ cmd: 'lms.ai.roadmap.getById' }, data);
  }

  updateProgress(data: {
    roadmapId: string;
    userId: string;
    week_number?: number;
    milestone_week?: number;
    progress_percentage?: number;
    time_spent_minutes?: number;
    notes?: string;
    ip?: string;
    userAgent?: string;
  }) {
    return this.client.send({ cmd: 'lms.ai.roadmap.updateProgress' }, data);
  }

  deleteRoadmap(data: { roadmapId: string; userId?: string }) {
    return this.client.send({ cmd: 'lms.ai.roadmap.delete' }, data);
  }

  getRoadmapHistory(data: {
    roadmapId: string;
    page?: string;
    limit?: string;
  }) {
    return this.client.send({ cmd: 'lms.ai.roadmap.getHistory' }, data);
  }

  getServiceStats() {
    return this.client.send({ cmd: 'lms.ai.roadmap.stats' }, {});
  }

  bulkDeleteRoadmaps(data: { roadmap_ids: string[]; user_id?: string }) {
    return this.client.send({ cmd: 'lms.ai.roadmap.batchDelete' }, data);
  }

  getQueryAnalytics(data: {
    start_date?: string;
    end_date?: string;
    user_id?: string;
  }) {
    return this.client.send({ cmd: 'lms.ai.roadmap.getQueryAnalytics' }, data);
  }

  testAiConnection() {
    return this.client.send({ cmd: 'lms.ai.roadmap.testAiConnection' }, {});
  }

  getSystemStatus() {
    return this.client.send({ cmd: 'lms.ai.roadmap.systemStatus' }, {});
  }

  getHealth() {
    return this.client.send({ cmd: 'lms.ai.roadmap.health' }, {});
  }
}
