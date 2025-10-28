import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({ summary: 'Get application status and information' })
  @ApiResponse({
    status: 200,
    description: 'Application information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'Healthy!' },
        service: { type: 'string', example: 'Vonova LMS AI - Complete AI Platform' },
        version: { type: 'string', example: '1.0.0' },
        description: { type: 'string', example: 'AI-powered learning platform' },
        timestamp: { type: 'string', format: 'date-time' },
        ports: {
          type: 'object',
          properties: {
            backend: { type: 'number', example: 4005 },
            roadmap_ai_service: { type: 'number', example: 5000 },
            pdf_summary_ai_service: { type: 'number', example: 5001 },
            frontend: { type: 'number', example: 3000 }
          }
        },
        features: {
          type: 'object',
          properties: {
            'AI Roadmap Generator': {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'Active' },
                description: { type: 'string', example: 'Generate personalized learning roadmaps using AI' },
                endpoints: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['POST /roadmap/generate', 'GET /roadmap/:roadmapId/:userId']
                }
              }
            }
          }
        }
      }
    }
  })
  getAppInfo() {
    return this.appService.getAppInfo();
  }
}
