import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from './chatbot.service';
import { getModelToken } from '@nestjs/mongoose';
import { Chatbot } from './entities/chatbot.entity';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let chatbotModelMock: {
    create: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
  };

  beforeEach(async () => {
    chatbotModelMock = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
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
