import { Injectable, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UserAccount } from 'src/schemas/userAccount.shema';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateUserAccountDto } from './dto/account.dto';

@Injectable()
export class AccountService {

 constructor(
    @InjectModel(UserAccount.name)
    private readonly userAccountModel: Model<UserAccount>,
  ) {}


 async getUserAccount(
    userId: string,
    defaults?: { name?: string; email?: string; avatarUrl?: string },
  ) {
    let account = await this.userAccountModel.findOne({ userId });

    if (!account) {
      const name = defaults?.name || '';
      const email = defaults?.email || '';

      if (name && email) {
        account = await this.userAccountModel.create({
          userId: new Types.ObjectId(userId),
          name,
          email,
          avatarUrl: defaults?.avatarUrl || null,
        });
      } else {
        throw new NotFoundException('User account not found');
      }
    }

    return account;
  }

  async updateUserAccount(userId: string, update: UpdateUserAccountDto) {
    const account = await this.userAccountModel
      .findOneAndUpdate({ userId }, { $set: update }, { upsert: true, new: true, runValidators: true })
      .lean();

    if (!account) throw new NotFoundException('User account not found');
    return account;
  }


}
