import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { User, UserSchema } from '../../models/auth/user.schema';
import { RefreshToken, RefreshTokenSchema } from '../../models/auth/refreshToken.schema';
import { PasswordReset, PasswordResetSchema } from '../../models/auth/passwordReset.schema';
import { EmailVerification, EmailVerificationSchema } from '../../models/auth/emailVerification.schema';
import { Account, AccountSchema } from '../../models/auth/account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}

