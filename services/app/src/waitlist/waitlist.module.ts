import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { WaitUser, WaitUserSchema } from './schema/wait-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WaitUser.name, schema: WaitUserSchema },
    ]),
  ],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
