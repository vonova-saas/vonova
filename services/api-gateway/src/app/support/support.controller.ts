/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { SupportGatewayService } from './support.service';
import { SupportDto, AddMessageDto, UpdateStatusDto } from './dto/support.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/v1/support')
@UseGuards(JwtAuthGuard)
export class SupportGatewayController {
  constructor(private readonly supportService: SupportGatewayService) {}

  @Post('user/:userId')
  async create(
    @Param('userId') userId: string,
    @Body() createSupportDto: SupportDto,
    @Request() req: any,
  ) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own billing information',
      );
    }

    return firstValueFrom(this.supportService.create(createSupportDto, userId));
  }

  @Get()
  async findAll(@Request() req: any) {
    return firstValueFrom(this.supportService.findAll(req.user._id));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(this.supportService.findOne(req.user._id, id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSupportDto: SupportDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.supportService.update(req.user._id, id, updateSupportDto),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(this.supportService.remove(req.user._id, id));
  }

  @Post(':id/messages')
  async createMessage(
    @Param('id') id: string,
    @Body() message: AddMessageDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.supportService.createMessage(req.user._id, id, message),
    );
  }

  @Get(':id/messages')
  async findOneMessages(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(
      this.supportService.findOneMessages(req.user._id, id),
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() status: UpdateStatusDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.supportService.updateStatus(req.user._id, id, status),
    );
  }
}
