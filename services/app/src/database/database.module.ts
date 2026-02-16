import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Import all schemas
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Account, AccountSchema } from '../auth/schemas/account.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from '../auth/schemas/refresh-token.schema';
import {
  EmailVerification,
  EmailVerificationSchema,
} from '../auth/schemas/email-verification.schema';
import {
  PasswordReset,
  PasswordResetSchema,
} from '../auth/schemas/password-reset.schema';

@Module({
  imports: [
    // Configure MongoDB connection using ConfigService
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('env.mongoUriRemote') ||
          process.env.MONGO_URI_RMOTE,
        // Optional: Add connection options here
        // retryWrites: true,
        // w: 'majority',
      }),
      inject: [ConfigService],
    }),
    // Register all schemas
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Account.name, schema: AccountSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
    ]),
  ],
  exports: [MongooseModule], // Export MongooseModule so other modules can use the models
})
export class DatabaseModule {}
