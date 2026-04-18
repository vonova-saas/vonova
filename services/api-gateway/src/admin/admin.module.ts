import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { AdminGatewayController } from './admin.controller';
import { DashboardSupportGatewayController } from './dashboard-support.controller';
import { AdminGatewayService } from './admin.service';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { ActivityTrackingInterceptor } from 'src/common/interceptors/activity-tracking.interceptor';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [AdminGatewayController, DashboardSupportGatewayController],
  providers: [
    AdminGatewayService,
    JwtAuthGuard,
    AdminGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityTrackingInterceptor,
    },
  ],
  exports: [AdminGatewayService],
})
export class AdminGatewayModule {}
