import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { BookGatewayController } from './book.gateway.controller';
import { BookGatewayService } from './book.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [BookGatewayController],
  providers: [BookGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class BookGatewayModule {}
