import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GatewayService } from './gateway.service';
import { config } from '../../config/gateway.config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InternalServerException, NotFoundException } from '../../utils/appError';

@ApiTags('Gateway')
@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) { }

  @Get('services')
  @ApiOperation({ summary: 'Get available services' })
  @ApiResponse({ status: 200, description: 'Available services' })
  async getServices() {
    try {
      const statusMap = await this.gatewayService.getServiceStatus();
      const now = new Date().toISOString();
      const services = Object.values(config.services).map((service) => ({
        name: service.name,
        url: service.url,
        healthCheck: service.healthCheck,
        timeout: service.timeout,
        healthy: statusMap[service.name] ?? false,
        lastCheckedAt: now,
      }));
      return {
        message: 'Available services',
        services,
      };
    } catch (err) {
      throw new InternalServerException('Failed to get services');
    }
  }

  @Get('services/status')
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getServiceStatus() {
    try {
      const status = await this.gatewayService.getServiceStatus();
      return {
        message: 'Service health status',
        status,
      };
    } catch (error) {
      throw new InternalServerException('Failed to get service status');
    }
  }

  @Post('nats/action/:subject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send an action via NATS (request/response)' })
  @ApiResponse({ status: 200, description: 'NATS action executed successfully' })
  async sendNatsAction(
    @Param('subject') subject: string,
    @Body() body: any,
  ) {
    try {
      const result = await this.gatewayService.forwardActionViaNats(subject, body);
      return {
        message: 'NATS action executed successfully',
        subject,
        result,
      };
    } catch (error) {
      throw new InternalServerException('Failed to execute NATS action');
    }
  }

  // Dynamic proxy routes - these will be registered dynamically
  // For now, we'll handle them via a catch-all route in main.ts or use a custom router
}

