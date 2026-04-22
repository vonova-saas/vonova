import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { AdminOtp, AdminOtpSchema } from './schemas/admin-otp.schema';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { EmailSenderService } from '../notification/email-sender.service';
import { getMongoConfigAdmin } from '../common/config/mongo-admin.config';
import { AdminSeederService } from './admin-seeder.service';

@Module({
  imports: [
    // Separate admin database connection
    MongooseModule.forRootAsync({
      connectionName: 'adminConnection',
      useFactory: () => getMongoConfigAdmin(),
    }),
    // Register admin schemas with admin connection
    MongooseModule.forFeature(
      [
        { name: Admin.name, schema: AdminSchema },
        { name: AdminOtp.name, schema: AdminOtpSchema },
      ],
      'adminConnection',
    ),
    // Passport for JWT strategy
    PassportModule,
    // JWT module for token generation
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT.JWT_ACCESS_SECRET') || 'fallback-secret',
        signOptions: {
          expiresIn: (configService.get<string>('JWT.JWT_ACCESS_EXPIRES_IN') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminAuthController],
  providers: [
    AdminAuthService,
    AdminJwtStrategy,
    EmailSenderService,
    AdminSeederService,
  ],
  exports: [AdminAuthService],
})
export class AdminAuthModule { }
