import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateChatbotMessageDto } from './dto/create-chatbot.dto';

@ApiTags('Chatbot')
@Controller('api/v1/chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  create(@Body() createChatbotDto: CreateChatbotMessageDto) {
    return this.chatbotService.create(createChatbotDto);
  }

  @Get()
  findAll() {
    return this.chatbotService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatbotService.findOne(id);
  }
}
