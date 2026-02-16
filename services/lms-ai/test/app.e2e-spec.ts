import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
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

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .set('Authorization', 'Bearer test-token')
      .set('User-Agent', 'Supertest')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('Healthy!');
      });
  });
});