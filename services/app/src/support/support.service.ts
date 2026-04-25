import { Injectable } from '@nestjs/common';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Support } from './schema/support.schema';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(Support.name)
    private readonly supportModel: Model<Support>,
  ) {}

  /** Public API: thread entries never expose internal Mongo subdocument ids. */
  private sanitizeMessageOut(m: Record<string, unknown> | null | undefined) {
    if (!m || typeof m !== 'object') return m;
    const out: Record<string, unknown> = {
      sender: m.sender,
      message: m.message,
      createdAt: m.createdAt,
    };
    if (m.senderName != null && String(m.senderName).trim() !== '') {
      out.senderName = m.senderName;
    }
    if (m.senderAvatarUrl != null && String(m.senderAvatarUrl).trim() !== '') {
      out.senderAvatarUrl = m.senderAvatarUrl;
    }
    return out;
  }

  private mapSupportToPublic(doc: Support | (Support & { toObject?: (opt?: object) => Record<string, unknown> }) | null) {
    if (doc == null) return doc;
    const o = typeof (doc as Support & { toObject?: (opt?: object) => Record<string, unknown> }).toObject === 'function'
      ? (doc as Support & { toObject: (opt?: object) => Record<string, unknown> }).toObject({ versionKey: false })
      : { ...(doc as object as Record<string, unknown>) };
    if (Array.isArray(o.messages)) {
      o.messages = o.messages.map((entry) => this.sanitizeMessageOut(entry as Record<string, unknown>));
    }
    return o;
  }

  async create(createSupportDto: CreateSupportDto, userId: string) {
    const support = await this.supportModel.create({
      ...createSupportDto,
      userId,
    });
    return {
      message: 'Support created successfully',
      data: this.mapSupportToPublic(support) as unknown as Support,
    };
  }

  async findAll(userId: string) {
    const support = await this.supportModel.find({ userId });
    if (!support) {
      throw new RpcException({
        statusCode: 404,
        message: `Support for user ${userId} not found`,
      });
    }
    return {
      message: 'Support found successfully',
      data: support.map((d) => this.mapSupportToPublic(d) as unknown as Support),
    };
  }

  async findOne(userId: string, id: string) {
    const support = await this.supportModel.findOne({ _id: id, userId }).exec();
    if (!support) {
      throw new RpcException({
        statusCode: 404,
        message: `Support for user ${userId} not found`,
      });
    }
    return {
      message: 'Support found successfully',
      data: this.mapSupportToPublic(support) as unknown as Support,
    };
  }

  async update(userId: string, id: string, updateSupportDto: UpdateSupportDto) {
    const support = await this.supportModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateSupportDto },
      { new: true },
    );
    if (!support) {
      throw new RpcException({
        statusCode: 404,
        message: `Support for user ${userId} not found`,
      });
    }
    return {
      message: 'Support updated successfully',
      data: this.mapSupportToPublic(support) as unknown as Support,
    };
  }

  async remove(userId: string, id: string) {
    const deleted = await this.supportModel.findOneAndDelete({
      _id: id,
      userId,
    });
    if (!deleted) {
      throw new RpcException({
        statusCode: 404,
        message: `Support for user ${userId} not found`,
      });
    }
    return {
      message: 'Support deleted successfully',
    };
  }

  async createMessage(userId: string, id: string, message: string) {
    const support = await this.supportModel.findOneAndUpdate(
      { _id: id, userId },
      {
        $push: { messages: { sender: 'user', message, createdAt: new Date() } },
        $set: { updatedAt: new Date() },
      },
      { new: true },
    );
    if (!support) {
      throw new RpcException({
        statusCode: 404,
        message: `Support for user ${userId} not found`,
      });
    }
    return {
      message: 'Message added successfully',
      data: (support.messages || []).map((m) => this.sanitizeMessageOut(m as unknown as Record<string, unknown>)),
    };
  }

  async findOneMessages(userId: string, id: string) {
    const support = await this.supportModel.findOne(
      { _id: id, userId },
      { messages: 1 },
    );
    if (!support) {
      throw new RpcException({
        statusCode: 404,
        message: `Support for user ${userId} not found`,
      });
    }
    return {
      message: 'Messages found successfully',
      data: (support.messages || []).map((m) => this.sanitizeMessageOut(m as unknown as Record<string, unknown>)),
    };
  }

  async updateStatus(userId: string, id: string, status: string) {
    const support = await this.supportModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status } },
      { new: true },
    );
    if (!support) {
      throw new RpcException({
        statusCode: 404,
        message: `Support for user ${userId} not found`,
      });
    }
    return {
      message: 'Status updated successfully',
      data: this.mapSupportToPublic(support) as unknown as Support,
    };
  }
}
