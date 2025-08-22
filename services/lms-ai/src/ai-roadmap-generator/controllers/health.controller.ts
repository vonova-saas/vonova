import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares/api/asyncHandler.middleware';
import { HTTPSTATUS } from '../../config/http.config';
import { Env } from '../../config/env.config';
import axios from 'axios';

/**
 * Health Controller for AI Service Communication
 * Tests connectivity between backend and AI service
 */
export class HealthController {

  /**
   * Test AI service connectivity
   * GET /api/roadmap/test-ai-connection
   */
  testAIConnection = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startTime = Date.now();
      
      // Test connection to AI service
      const response = await axios.get(`${Env.ROADMAP_AI_SERVICE_URL}/health`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const responseTime = Date.now() - startTime;
      
      if (response.status !== 200) {
        return res.status(HTTPSTATUS.SERVICE_UNAVAILABLE).json({
          success: false,
          message: 'AI service is not responding',
          data: {
            backend_service: {
              status: 'healthy',
              port: Env.PORT,
              timestamp: new Date().toISOString()
            },
            ai_service: {
              status: 'unhealthy',
              url: Env.ROADMAP_AI_SERVICE_URL,
              error: `HTTP ${response.status}: ${response.statusText}`,
              response_time_ms: responseTime
            }
          }
        });
      }

      const aiHealthData = response.data;

      return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: 'AI service connection successful',
        data: {
          backend_service: {
            status: 'healthy',
            port: Env.PORT,
            environment: Env.NODE_ENV,
            timestamp: new Date().toISOString(),
            uptime_seconds: process.uptime()
          },
          ai_service: {
            status: 'healthy',
            url: Env.ROADMAP_AI_SERVICE_URL,
            response_time_ms: responseTime,
            data: aiHealthData
          },
          communication: {
            status: 'connected',
            latency_ms: responseTime,
            test_timestamp: new Date().toISOString()
          }
        }
      });
      
    } catch (error) {
      console.error('AI service connection test failed:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            errorMessage = 'Connection timeout - AI service not responding';
          } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused - AI service may not be running';
          } else if (error.response) {
            errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
          } else if (error.request) {
            errorMessage = 'No response received from AI service';
          }
        }
      }

      return res.status(HTTPSTATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Failed to connect to AI service',
        data: {
          backend_service: {
            status: 'healthy',
            port: Env.PORT,
            timestamp: new Date().toISOString()
          },
          ai_service: {
            status: 'unreachable',
            url: Env.ROADMAP_AI_SERVICE_URL,
            error: errorMessage
          },
          communication: {
            status: 'disconnected',
            test_timestamp: new Date().toISOString()
          },
          troubleshooting: {
            steps: [
              '1. Verify AI service is running on port 5000',
              '2. Check if ROADMAP_AI_SERVICE_URL is correctly configured',
              '3. Ensure no firewall is blocking the connection',
              '4. Run: python models/roadmap_model/start_ai_service.py'
            ]
          }
        }
      });
    }
  });

  /**
   * Get comprehensive system status
   * GET /api/roadmap/system-status
   */
  getSystemStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const systemInfo: any = {
        backend: {
          service: 'lms-ai-backend',
          version: '1.0.0',
          port: Env.PORT,
          environment: Env.NODE_ENV,
          uptime_seconds: process.uptime(),
          memory_usage: process.memoryUsage(),
          timestamp: new Date().toISOString()
        },
        configuration: {
          ai_service_url: Env.ROADMAP_AI_SERVICE_URL,
          base_path: Env.BASE_PATH,
          frontend_origin: Env.FRONTEND_ORIGIN,
          mongo_connected: true, // This would be checked in real implementation
        },
        ports: {
          backend: parseInt(Env.PORT),
          ai_service: 5000,
          frontend: 3000
        }
      };

      // Test AI service connectivity
      try {
        const aiResponse = await fetch(`${Env.ROADMAP_AI_SERVICE_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          systemInfo['ai_service'] = {
            status: 'connected',
            data: aiData
          };
        } else {
          systemInfo['ai_service'] = {
            status: 'error',
            error: `HTTP ${aiResponse.status}`
          };
        }
      } catch (error) {
        systemInfo['ai_service'] = {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      const overallStatus = systemInfo['ai_service']?.status === 'connected' ? 'healthy' : 'partial';

      return res.status(HTTPSTATUS.OK).json({
        success: true,
        message: 'System status retrieved',
        data: {
          overall_status: overallStatus,
          ...systemInfo
        }
      });
      
    } catch (error) {
      console.error('System status check failed:', error);
      
      return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve system status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// Export singleton instance
export const healthController = new HealthController();

// Also export as default for easier importing
export default healthController;
