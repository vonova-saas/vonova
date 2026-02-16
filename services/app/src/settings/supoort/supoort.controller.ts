import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { SupportService } from './supoort.service';
import { AddMessageDto, CreateSupportDto } from './dto/support.dto';
import { UpdateSupportDto } from './dto/support.dto';
import { UpdateStatusDto } from './dto/support.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post(':userId/add')
  createSupport(
    @Param('userId') userId: string,
    @Body() dto: CreateSupportDto,
  ) {
    return this.supportService.addUserSupport(userId, dto);
  }

  @Get(':userId')
  getSupports(@Param('userId') userId: string) {
    return this.supportService.getUserSupports(userId);
  }

  @Get(':userId/:id')
  getSupportById(@Param('userId') userId: string, @Param('id') id: string) {
    return this.supportService.getUserSupportById(userId, id);
  }

  @Put(':userId/:id')
  updateSupport(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupportDto,
  ) {
    return this.supportService.updateUserSupport(userId, id, dto);
  }

  @Delete(':userId/:id')
  deleteSupport(@Param('userId') userId: string, @Param('id') id: string) {
    return this.supportService.deleteUserSupport(userId, id);
  }

  @Post(':userId/:id/messages')
  addMessage(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(userId, id, dto.message);
  }

  @Get(':userId/:id/messages')
  getMessages(@Param('userId') userId: string, @Param('id') id: string) {
    return this.supportService.getMessages(userId, id);
  }

  @Put(':userId/:id/status')
  updateStatus(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.supportService.updateStatus(userId, id, dto.status);
  }
}
