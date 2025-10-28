import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Health Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function withAuth(r: request.Test) {
    // Guard allows any bearer token in dev; set a dummy one for consistency
    return r.set('Authorization', 'Bearer test-token');
  }

  it('GET /roadmap/health returns service healthy payload', async () => {
    const res = await withAuth(request(app.getHttpServer()).get('/roadmap/health')).expect(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.stringContaining('Roadmap service'),
    });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /pdf-summary/health returns service healthy payload', async () => {
    const res = await withAuth(request(app.getHttpServer()).get('/pdf-summary/health')).expect(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.stringContaining('PDF Summary Service is healthy'),
      service: 'pdf-summary',
      version: expect.any(String),
    });
    expect(typeof res.body.timestamp).toBe('string');
  });
});


