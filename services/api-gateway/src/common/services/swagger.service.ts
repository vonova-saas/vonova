/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import expressBasicAuth from 'express-basic-auth';
import { LoggerService } from './logger.service';

@Injectable()
export class SwaggerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  createSwaggerDocument(app: INestApplication) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Vonova API Gateway')
      .setDescription(
        'API Gateway for Vonova microservices platform. ' +
          'This gateway provides a single entry point for all microservices, handling authentication, ' +
          'routing, and request proxying. The platform includes authentication, app services, LMS services, ' +
          'and AI-powered features like roadmap generation and PDF summarization.',
      )
      .setVersion('1.0.0')
      .setContact(
        'Vonova Company',
        'https://vonova.tech',
        'vonovacompany@gmail.com',
      )
      .setLicense('CC-BY-4.0', 'https://creativecommons.org/licenses/by/4.0/');

    // Server URLs from .env; first added is the default for "Execute" in Swagger UI
    const publicOrigin = this.configService.get<string>('API_GATEWAY_ORIGIN');
    const localUrl =
      this.configService.get<string>('SWAGGER_SERVER_LOCAL') ||
      `http://localhost:${this.configService.get('PORT')}`;
    const productionUrl = this.configService.get<string>('SWAGGER_SERVER_PRODUCTION');

    if (publicOrigin) {
      swaggerConfig.addServer(publicOrigin, 'Current Server (Railway / Deployed)');
    }
    swaggerConfig.addServer(localUrl, 'Local Development Server');
    if (productionUrl) {
      swaggerConfig.addServer(productionUrl, 'Production');
    }
    swaggerConfig
      .addTag('Auth', 'Authentication and authorization endpoints')
      .addTag('Gateway', 'Gateway status and service management')
      .addTag('Health', 'Health check endpoints for gateway and services')
      .addTag('App Service', 'App service endpoints (proxied)')
      .addTag('LMS Service', 'LMS service endpoints (proxied)')
      .addTag('Roadmap AI', 'AI-powered learning roadmap generation')
      .addTag('PDF Summary', 'AI-powered PDF summarization and chat')
      // Cookie-based authentication (primary method)
      .addApiKey(
        {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description:
            'JWT access token stored in HTTP-only cookie. Set automatically after login.',
        },
        'cookie',
      )
      // Bearer token authentication (alternative)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT access token (alternative to cookie-based auth). Use Authorization: Bearer <token> header.',
        },
        'bearer',
      );

    // Add basic auth for production Swagger UI protection
    if (
      this.configService.get('NODE_ENV') === 'production' &&
      this.configService.get('SWAGGER_USER') &&
      this.configService.get('SWAGGER_PASSWORD')
    ) {
      swaggerConfig.addBasicAuth(
        {
          type: 'http',
          scheme: 'basic',
          description: 'Basic authentication for Swagger UI access',
        },
        'basic',
      );
    }

    return swaggerConfig.build();
  }

  setupSwagger(app: INestApplication) {
    const config = this.createSwaggerDocument(app);
    const document = SwaggerModule.createDocument(app, config);

    // Swagger UI options
    const swaggerOptions: any = {
      customSiteTitle: 'Vonova API Gateway Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
    };

    // Add basic auth middleware for production
    if (
      this.configService.get('NODE_ENV') === 'production' &&
      this.configService.get('SWAGGER_USER') &&
      this.configService.get('SWAGGER_PASSWORD')
    ) {
      app.use(
        '/api-docs',
        expressBasicAuth({
          users: {
            [this.configService.get('SWAGGER_USER') as string]:
              this.configService.get('SWAGGER_PASSWORD') as string,
          },
          challenge: true,
          realm: 'Vonova API Gateway',
        }),
      );
    }

    SwaggerModule.setup('api-docs', app, document, swaggerOptions);

    this.loggerService.log(
      `📚 Swagger docs available at http://localhost:${this.configService.get('PORT')}/api-docs`,
    );
    if (
      this.configService.get('NODE_ENV') === 'production' &&
      this.configService.get('SWAGGER_USER') &&
      this.configService.get('SWAGGER_PASSWORD')
    ) {
      this.loggerService.log(
        `🔐 Swagger UI protected with basic authentication`,
      );
    }
  }
}
