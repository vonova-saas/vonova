import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schema/user.schema';
import { Account, AccountSchema } from '../auth/schema/account.schema';
import { AdminSeederService } from './admin-seeder.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  providers: [AdminSeederService],
  exports: [AdminSeederService],
})
export class AdminSeedModule {}
