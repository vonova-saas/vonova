import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { getModelToken } from '@nestjs/mongoose';
import { Chatbot } from './entities/chatbot.entity';

describe('ChatbotController', () => {
  let controller: ChatbotController;
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
      controllers: [ChatbotController],
      providers: [
        ChatbotService,
        {
          provide: getModelToken(Chatbot.name),
          useValue: chatbotModelMock,
        },
      ],
    }).compile();

    controller = module.get<ChatbotController>(ChatbotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
