import { Module } from '@nestjs/common';
import { PdfSummaryGatewayController } from './pdf-summary.controller';
import { PdfSummaryGatewayService } from './pdf-summary.service';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [PdfSummaryGatewayController],
  providers: [PdfSummaryGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class PdfSummaryGatewayModule {}
