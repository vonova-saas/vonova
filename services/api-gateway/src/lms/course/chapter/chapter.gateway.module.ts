import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { ChapterGatewayController } from './chapter.gateway.controller';
import { ChapterGatewayService } from './chapter.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ChapterGatewayController],
  providers: [ChapterGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class ChapterGatewayModule {}
