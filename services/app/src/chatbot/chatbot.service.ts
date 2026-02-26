import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateChatbotMessageDto } from './dto/create-chatbot.dto';
import { Chatbot, ChatbotDocument } from './entities/chatbot.entity';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectModel(Chatbot.name)
    private readonly chatbotModel: Model<ChatbotDocument>,
  ) {}

  // ➕ Create message
  async create(createChatbotDto: CreateChatbotMessageDto): Promise<Chatbot> {
    const message = new this.chatbotModel(createChatbotDto);
    return message.save();
  }

  // 📥 Get all messages
  async findAll(): Promise<Chatbot[]> {
    return this.chatbotModel.find().sort({ createdAt: -1 }).lean();
  }

  // 📌 Get messages by chatId
  async findByChatId(chatId: string): Promise<Chatbot[]> {
    return this.chatbotModel.find({ chatId }).sort({ createdAt: 1 }).lean();
  }

  // 🔍 Get single message by ID
  async findOne(id: string): Promise<Chatbot> {
    const chatbot = await this.chatbotModel.findById(id).lean();

    if (!chatbot) {
      throw new NotFoundException('Chatbot message not found');
    }

    return chatbot;
  }
}
