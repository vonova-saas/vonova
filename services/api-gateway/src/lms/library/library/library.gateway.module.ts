import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { LibraryGatewayController } from './library.gateway.controller';
import { LibraryGatewayService } from './library.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [LibraryGatewayController],
  providers: [LibraryGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class LibraryGatewayModule {}
