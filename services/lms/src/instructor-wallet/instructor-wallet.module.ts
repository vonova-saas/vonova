import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { InstructorWalletService } from './services/instructor-wallet.service';
import { InstructorWalletController } from './controllers/instructor-wallet.controller';

/**
 * Instructor Wallet Module
 * 
 * Complete earnings and wallet management for instructors
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
  ],
  controllers: [InstructorWalletController],
  providers: [InstructorWalletService],
  exports: [InstructorWalletService],
})
export class InstructorWalletModule {}
