import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { GatewayProxyMiddleware } from '../../common/middleware/gateway-proxy.middleware';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoggerService } from '../../common/services/logger.service';
import { User, UserSchema } from '../../models/auth/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService, GatewayProxyMiddleware, JwtAuthGuard, LoggerService],
  exports: [GatewayService, GatewayProxyMiddleware, JwtAuthGuard],
})
export class GatewayModule { }

