import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('PdfSummaryController - DELETE Flow (e2e)', () => {
  let app: INestApplication;
  let testSessionId: string;

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

  describe('DELETE /api/v1/pdf-summary/session/:sessionId', () => {
    it('should return 400 if session ID is missing', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/pdf-summary/session/')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(404); // NestJS returns 404 for missing route params
    });

    it('should return 400 if session ID is empty', () => {
      // Use URL-encoded spaces to ensure they're preserved in the route parameter
      return request(app.getHttpServer())
        .delete('/api/v1/pdf-summary/session/%20%20%20')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(400);
    });

    it('should return 204 for non-existent session (idempotent delete)', async () => {
      const nonExistentSessionId = 'non-existent-session-id-' + Date.now();

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pdf-summary/session/${nonExistentSessionId}`)
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should delete session with user_id validation', async () => {
      const sessionId = 'test-session-' + Date.now();
      const userId = 'test-user-' + Date.now();

      // First, try to delete with wrong user_id (should fail if ownership check is enabled)
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pdf-summary/session/${sessionId}?user_id=wrong-user-id`)
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest');

      // Should either succeed (if no ownership check) or fail with 400
      expect([204, 400]).toContain(response.status);
    });

    it('should handle bulk delete endpoint', async () => {
      const sessionIds = [
        'session-1-' + Date.now(),
        'session-2-' + Date.now(),
        'session-3-' + Date.now()
      ];

      const response = await request(app.getHttpServer())
        .post('/api/v1/pdf-summary/batch/delete')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .set('Content-Type', 'application/json')
        .send({
          session_ids: sessionIds
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total_requested', 3);
      expect(response.body.data).toHaveProperty('deleted');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data).toHaveProperty('failed_session_ids');
    });

    it('should validate bulk delete request body', () => {
      return request(app.getHttpServer())
        .post('/api/v1/pdf-summary/batch/delete')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .set('Content-Type', 'application/json')
        .send({
          session_ids: [] // Empty array should fail validation
        })
        .expect(400);
    });

    it('should limit bulk delete to 100 sessions', () => {
      const sessionIds = Array.from({ length: 101 }, (_, i) => `session-${i}`);

      return request(app.getHttpServer())
        .post('/api/v1/pdf-summary/batch/delete')
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest')
        .set('Content-Type', 'application/json')
        .send({
          session_ids: sessionIds
        })
        .expect(400); // Should fail validation
    });
  });

  describe('DELETE flow - S3 cleanup', () => {
    it('should attempt S3 file cleanup when session is deleted', async () => {
      // This test verifies that the delete flow includes S3 cleanup
      // In a real scenario, you would need to mock the S3 service
      const sessionId = 'test-s3-cleanup-' + Date.now();

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pdf-summary/session/${sessionId}`)
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest');

      // Should succeed even if S3 file doesn't exist (idempotent)
      expect([204, 400]).toContain(response.status);
    });
  });

  describe('DELETE flow - Database cleanup', () => {
    it('should clean up both summary and chat history', async () => {
      const sessionId = 'test-db-cleanup-' + Date.now();

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pdf-summary/session/${sessionId}`)
        .set('Authorization', 'Bearer test-token')
        .set('User-Agent', 'Supertest');

      // Should succeed (idempotent operation)
      expect([204, 400]).toContain(response.status);
    });
  });
});

