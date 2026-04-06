/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from './schema/user.schema';
import { Account, AccountSchema } from './schema/account.schema';
import { RefreshToken, RefreshTokenSchema } from './schema/refreshToken.schema';
import {
  EmailVerification,
  EmailVerificationSchema,
} from './schema/emailVerification.schema';
import {
  PasswordReset,
  PasswordResetSchema,
} from './schema/passwordReset.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';
import { NotificationModule } from '../notification/notification.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import configuration from '../common/config/configuration';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Account.name, schema: AccountSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
    ]),
    (() => {
      const accessSecret = configuration().JWT.JWT_ACCESS_SECRET;
      const accessExpiresIn = configuration().JWT.JWT_ACCESS_EXPIRES_IN;
      if (!accessSecret || !accessExpiresIn) {
        throw new Error(
          'JWT_ACCESS_SECRET and JWT_ACCESS_EXPIRES_IN are required in .env',
        );
      }
      return JwtModule.register({
        secret: accessSecret,
        signOptions: {
          expiresIn: accessExpiresIn as any,
        },
      });
    })(),
    NotificationModule,
    WaitlistModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenBlacklistService],
})
export class AuthModule {}
