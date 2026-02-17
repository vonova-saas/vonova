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
    JwtModule.register({
      secret: configuration().JWT.JWT_ACCESS_SECRET || 'fallback-secret-key',
      signOptions: {
        expiresIn: configuration().JWT.JWT_ACCESS_EXPIRES_IN || ('1h' as any),
      },
    }),
    NotificationModule,
    WaitlistModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
