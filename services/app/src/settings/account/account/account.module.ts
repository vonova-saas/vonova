import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { UserAccount, UserAccountSchema } from 'src/schemas/userAccount.shema';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountController } from './account.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: UserAccount.name, schema: UserAccountSchema }])],
    providers: [AccountService],
    controllers: [AccountController],
    exports: [AccountService],
})
export class AccountModule {}
