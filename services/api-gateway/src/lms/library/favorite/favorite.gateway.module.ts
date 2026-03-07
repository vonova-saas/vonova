import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { FavoriteGatewayController } from './favorite.gateway.controller';
import { FavoriteGatewayService } from './favorite.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [FavoriteGatewayController],
  providers: [FavoriteGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class FavoriteGatewayModule {}
