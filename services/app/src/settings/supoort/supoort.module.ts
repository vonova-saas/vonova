import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportController } from './supoort.controller';
import { SupportService } from './supoort.service';
import { UserSupport, UserSupportSchema } from '../../schemas/support.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSupport.name, schema: UserSupportSchema },
    ]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
