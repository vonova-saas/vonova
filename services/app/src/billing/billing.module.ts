import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserBilling, UserBillingSchema } from './schema/billing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserBilling.name, schema: UserBillingSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
