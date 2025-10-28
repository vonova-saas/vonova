import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) { }

  getAppInfo() {
    return {
      status: 'Healthy!',
      service: 'Vonova LMS AI - Complete AI Platform',
      version: '1.0.0',
      description: 'AI-powered learning platform with roadmap generation, PDF summarization, and more',
      timestamp: new Date().toISOString(),
      ports: {
        backend: parseInt(this.configService.get('PORT', '4005')),
        roadmap_ai_service: 5000,
        pdf_summary_ai_service: 5001,
        frontend: 3000
      },
      features: {
        'AI Roadmap Generator': {
          status: 'Active',
          description: 'Generate personalized learning roadmaps using AI',
          endpoints: [
            'POST /roadmap/generate',
            'GET /roadmap/:roadmapId/:userId',
            'PUT /roadmap/:roadmapId/progress/:userId'
          ]
        },
        'AI PDF Summary': {
          status: 'Active',
          description: 'Intelligent PDF document summarization and chat',
          endpoints: [
            'POST /pdf-summary/upload',
            'POST /pdf-summary/chat',
            'GET /pdf-summary/summarize',
            'GET /pdf-summary/session/:sessionId/chat-history'
          ]
        },
        'AI Problem Solving': {
          status: 'Coming Soon',
          description: 'AI-powered problem solving assistance',
          endpoints: ['POST /problem-solving/solve']
        },
        'AI Assistant': {
          status: 'Coming Soon',
          description: 'Intelligent learning assistant chatbot',
          endpoints: ['POST /assistant/chat']
        },
        'AI Video Generator': {
          status: 'Coming Soon',
          description: 'Generate educational videos from content',
          endpoints: ['POST /video-gen/create']
        }
      },
      monitoring: {
        health: `/roadmap/health`,
        roadmap_ai_connection: `/roadmap/test-ai-connection`,
        pdf_summary_health: `/pdf-summary/health`,
        system_status: `/roadmap/system-status`,
        analytics: undefined
      },
      documentation: {
        swagger_ui: '/api-docs',
        interactive_api: '/api-docs',
        authentication: 'Bearer Token'
      },
      communication: {
        roadmap_ai_service_url: this.configService.get('ROADMAP_AI_SERVICE_URL'),
        pdf_summary_ai_service_url: this.configService.get('PDF_SUMMARY_AI_SERVICE_URL'),
        status: 'Backend ↔ AI Services communication configured',
        protocol: 'HTTP REST API'
      }
    };
  }
}
