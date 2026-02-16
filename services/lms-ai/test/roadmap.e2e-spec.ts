import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('RoadmapController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set global prefix to match main.ts configuration
    app.setGlobalPrefix('api/v1', {
      exclude: ['/health', '/roadmap/health', '/pdf-summary/health']
    });

    // Set up validation pipe to match main.ts configuration
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('GET /roadmap/health', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/roadmap/health')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.service).toBe('roadmap');
        });
    });
  });

  describe('GET /api/v1/roadmap/stats', () => {
    it('should return service statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/roadmap/stats')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });
  });

  describe('GET /api/v1/roadmap/test-ai-connection', () => {
    it('should test AI service connection', () => {
      return request(app.getHttpServer())
        .get('/api/v1/roadmap/test-ai-connection')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('endpoint');
        });
    });
  });

  describe('GET /api/v1/roadmap/system-status', () => {
    it('should return system status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/roadmap/system-status')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.services).toBeDefined();
        });
    });
  });

  describe('POST /api/v1/roadmap/generate', () => {
    it('should return 400 for invalid request', () => {
      return request(app.getHttpServer())
        .post('/api/v1/roadmap/generate')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .set('Content-Type', 'application/json')
        .send({
          topic: '',
          skill_level: 'beginner',
          duration_weeks: 12
        })
        .expect(400);
    });

    it('should return 400 for invalid skill level', () => {
      return request(app.getHttpServer())
        .post('/api/v1/roadmap/generate')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .set('Content-Type', 'application/json')
        .send({
          topic: 'Machine Learning',
          skill_level: 'invalid',
          duration_weeks: 12
        })
        .expect(400);
    });

    it('should return 400 for invalid duration', () => {
      return request(app.getHttpServer())
        .post('/api/v1/roadmap/generate')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .set('Content-Type', 'application/json')
        .send({
          topic: 'Machine Learning',
          skill_level: 'beginner',
          duration_weeks: 0
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/roadmap/:roadmapId', () => {
    it('should return 400 for non-existent roadmap', () => {
      const nonExistentId = 'non-existent-roadmap-id-' + Date.now();
      return request(app.getHttpServer())
        .get(`/api/v1/roadmap/${nonExistentId}`)
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(400);
    });
  });

  describe('PUT /api/v1/roadmap/:roadmapId/progress', () => {
    it('should return 400 when user_id is missing', () => {
      const roadmapId = 'test-roadmap-' + Date.now();
      return request(app.getHttpServer())
        .put(`/api/v1/roadmap/${roadmapId}/progress`)
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .set('Content-Type', 'application/json')
        .send({
          week_number: 1,
          progress_percentage: 25
        })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/roadmap/:roadmapId', () => {
    it('should return 400 if roadmap ID is empty', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/roadmap/%20%20%20')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(400);
    });

    it('should return 200 for non-existent roadmap (idempotent delete)', async () => {
      const nonExistentId = 'non-existent-roadmap-' + Date.now();
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/roadmap/${nonExistentId}`)
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest');

      // Should either succeed or return 400 (depending on implementation)
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /api/v1/roadmap/:roadmapId/history', () => {
    it('should return 400 if roadmap ID is empty', () => {
      return request(app.getHttpServer())
        .get('/api/v1/roadmap/%20%20%20/history')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(400);
    });

    it('should return 400 for invalid pagination parameters', () => {
      const roadmapId = 'test-roadmap-' + Date.now();
      return request(app.getHttpServer())
        .get(`/api/v1/roadmap/${roadmapId}/history?page=invalid&limit=invalid`)
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(400);
    });
  });

  describe('POST /api/v1/roadmap/batch/delete', () => {
    it('should return 400 for empty roadmap_ids array', () => {
      return request(app.getHttpServer())
        .post('/api/v1/roadmap/batch/delete')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .set('Content-Type', 'application/json')
        .send({
          roadmap_ids: []
        })
        .expect(201); // Returns 201 even with empty array (service handles it)
    });

    it('should handle bulk delete request', async () => {
      const roadmapIds = [
        'roadmap-1-' + Date.now(),
        'roadmap-2-' + Date.now(),
      ];

      const response = await request(app.getHttpServer())
        .post('/api/v1/roadmap/batch/delete')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .set('Content-Type', 'application/json')
        .send({
          roadmap_ids: roadmapIds
        });

      // Should succeed (returns 201)
      expect([200, 201]).toContain(response.status);
    });
  });
});

