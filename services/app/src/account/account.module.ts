import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountController } from './account.controller';
import { User, UserSchema } from '../auth/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AccountService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
