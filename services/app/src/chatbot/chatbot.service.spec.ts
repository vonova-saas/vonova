import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatbotService } from './chatbot.service';
import { Chatbot } from './entities/chatbot.entity';

describe('ChatbotService', () => {
  let service: ChatbotService;

  beforeEach(async () => {
    const chatbotModelMock = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: getModelToken(Chatbot.name),
          useValue: chatbotModelMock,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
