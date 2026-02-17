import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateAccountDto } from './dto/update-account.dto';
import { RpcException } from '@nestjs/microservices';
import { User } from '../auth/schema/user.schema';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async findOne(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: `User with id '${userId}' not found.`,
      });
    }

    return {
      message: 'User account found successfully',
      data: {
        _id: user._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.profilePictureUrl,
        bio: user.bio || '',
        dateOfBirth: user.dateOfBirth || null,
        address: user.address || '',
      },
    };
  }

  async update(userId: string, update: UpdateAccountDto) {
    // Check if user exists
    const existingUser = await this.userModel.findById(userId);

    if (!existingUser) {
      throw new RpcException({
        statusCode: 404,
        message: `User with id '${userId}' not found. Cannot update non-existent user.`,
      });
    }

    // Update the user with account data
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            ...(update.name && { name: update.name }),
            ...(update.avatarUrl && { profilePictureUrl: update.avatarUrl }),
            ...(update.bio !== undefined && { bio: update.bio }),
            ...(update.dateOfBirth !== undefined && {
              dateOfBirth: update.dateOfBirth,
            }),
            ...(update.address !== undefined && { address: update.address }),
          },
        },
        { new: true, runValidators: true },
      )
      .lean();

    return {
      message: 'User account updated successfully',
      data: {
        _id: updatedUser!._id,
        userId: updatedUser!._id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        avatarUrl: updatedUser!.profilePictureUrl,
        bio: updatedUser!.bio || '',
        dateOfBirth: updatedUser!.dateOfBirth || null,
        address: updatedUser!.address || '',
      },
    };
  }
}
