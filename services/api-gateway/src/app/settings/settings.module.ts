import { Module } from '@nestjs/common';
import { SettingsGatewayController } from './settings.controller';
import { SettingsGatewayService } from './settings.service';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../auth/auth.module';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [SettingsGatewayController],
  providers: [SettingsGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class SettingsGatewayModule {}
