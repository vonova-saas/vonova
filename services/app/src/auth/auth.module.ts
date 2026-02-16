import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule, // Import DatabaseModule to access registered models
    PassportModule.register({ defaultStrategy: 'google' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
