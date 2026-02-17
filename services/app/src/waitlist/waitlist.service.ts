/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { WaitUser, WaitUserDocument } from './schema/wait-user.schema';
import { AddWaitUserDto } from './dto/add-wait-user.dto';
import { CheckPromoCodeDto } from './dto/check-promo-code.dto';

export interface CheckCouponCodeDto {
  email: string;
  couponCode: string;
}

export interface CouponValidationResult {
  valid: boolean;
  email: string;
  couponCode: string;
  fullName?: string;
  expiresAt?: Date;
  used?: boolean;
  message?: string;
}

@Injectable()
export class WaitlistService {
  constructor(
    @InjectModel(WaitUser.name)
    private readonly waitUserModel: Model<WaitUserDocument>,
  ) {}

  async addWaitUser(dto: AddWaitUserDto): Promise<{
    message: string;
    email: string;
    fullName: string;
  }> {
    const { email, fullName } = dto;

    const existingUser = await this.waitUserModel
      .findOne({ email: email.toLowerCase().trim() })
      .exec();
    if (existingUser) {
      throw new RpcException({
        statusCode: 400,
        message: 'Email already exists in waitlist',
        error: 'Bad Request',
      });
    }

    // Generate 6-digit promo code
    const promoCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newWaitUser = new this.waitUserModel({
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      promoCode,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
      used: false,
    });
    await newWaitUser.save();

    // TODO: Send confirmation email
    // await this.sendWaitlistConfirmationEmail(newWaitUser.email, newWaitUser.fullName, newWaitUser.promoCode, totalCount);

    return {
      message: 'User added successfully to the waitlist',
      email: email,
      fullName: fullName,
    };
  }

  async checkPromoCodeForEmail(
    dto: CheckPromoCodeDto,
  ): Promise<CouponValidationResult> {
    const { email, promoCode } = dto;

    if (!email || !promoCode) {
      throw new RpcException({
        statusCode: 400,
        message: 'Email and promoCode are required',
        error: 'Bad Request',
      });
    }

    const user = await this.waitUserModel
      .findOne({
        email: email.toLowerCase().trim(),
        promoCode: promoCode.trim(),
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'Invalid or expired promo code for the provided email',
        error: 'Not Found',
      });
    }

    return {
      valid: true,
      fullName: user.fullName,
      email: user.email,
      couponCode: user.promoCode,
      expiresAt: user.expiresAt,
      used: user.used,
      message: 'Promo code validated successfully',
    };
  }

  async checkCouponCode(
    dto: CheckCouponCodeDto,
  ): Promise<CouponValidationResult> {
    // This method integrates with the auth module
    return this.checkPromoCodeForEmail({
      email: dto.email,
      promoCode: dto.couponCode,
    });
  }

  async getAllWaitUsers(): Promise<{
    message: string;
    count: number;
    users: Array<{
      fullName: string;
      email: string;
      promoCode: string;
      expiresAt: Date;
      used: boolean;
    }>;
  }> {
    try {
      const users = await this.waitUserModel
        .find({})
        .select('-__v')
        .sort({ createdAt: -1 })
        .exec();

      return {
        message: 'Waitlist users retrieved successfully',
        count: users.length,
        users: users.map((user) => ({
          fullName: user.fullName,
          email: user.email,
          promoCode: user.promoCode,
          expiresAt: user.expiresAt,
          used: user.used,
        })),
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to retrieve waitlist users',
        error: 'Bad Request',
      });
    }
  }

  async getWaitUserById(userId: string): Promise<{
    message: string;
    fullName: string;
    email: string;
  }> {
    try {
      const user = await this.waitUserModel
        .findById(userId)
        .select('-__v')
        .exec();

      if (!user) {
        throw new RpcException({
          statusCode: 404,
          message: 'Waitlist user not found',
          error: 'Not Found',
        });
      }

      return {
        message: 'Waitlist user retrieved successfully',
        fullName: user.fullName,
        email: user.email,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to retrieve waitlist user',
        error: 'Bad Request',
      });
    }
  }

  async deleteWaitUser(userId: string): Promise<{
    message: string;
    deletedUser: {
      id: string;
      email: string;
      fullName: string;
    };
  }> {
    try {
      const user = await this.waitUserModel.findByIdAndDelete(userId).exec();

      if (!user) {
        throw new RpcException({
          statusCode: 404,
          message: 'Waitlist user not found',
          error: 'Not Found',
        });
      }

      return {
        message: 'Waitlist user deleted successfully',
        deletedUser: {
          id: user._id?.toString() || user.id?.toString() || '',
          email: user.email,
          fullName: user.fullName,
        },
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to delete waitlist user',
        error: 'Bad Request',
      });
    }
  }

  async markPromoCodeAsUsed(email: string, promoCode: string): Promise<void> {
    await this.waitUserModel
      .updateOne(
        { email: email.toLowerCase().trim(), promoCode: promoCode.trim() },
        { used: true },
      )
      .exec();
  }

  async getWaitlistStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usedCodes: number;
    expiredCodes: number;
  }> {
    const totalUsers = await this.waitUserModel.countDocuments().exec();
    const activeUsers = await this.waitUserModel
      .countDocuments({ used: false, expiresAt: { $gt: new Date() } })
      .exec();
    const usedCodes = await this.waitUserModel
      .countDocuments({ used: true })
      .exec();
    const expiredCodes = await this.waitUserModel
      .countDocuments({ expiresAt: { $lte: new Date() } })
      .exec();

    return {
      totalUsers,
      activeUsers,
      usedCodes,
      expiredCodes,
    };
  }
}
