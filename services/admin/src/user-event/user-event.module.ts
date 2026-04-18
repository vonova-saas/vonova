import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEvent, UserEventSchema } from './schemas/user-event.schema';
import { UserEventService } from './user-event.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEvent.name, schema: UserEventSchema },
    ]),
  ],
  providers: [UserEventService],
  exports: [UserEventService],
})
export class UserEventModule {}
