import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @MessagePattern({ cmd: 'createSupport' })
  create(
    @Payload('userId') userId: string,
    @Payload('createSupportDto') createSupportDto: CreateSupportDto,
  ) {
    return this.supportService.create(createSupportDto, userId);
  }

  @MessagePattern({ cmd: 'findAllSupport' })
  findAll(@Payload('userId') userId: string) {
    return this.supportService.findAll(userId);
  }

  @MessagePattern({ cmd: 'findOneSupport' })
  findOne(@Payload('userId') userId: string, @Payload() id: string) {
    return this.supportService.findOne(userId, id);
  }

  @MessagePattern({ cmd: 'updateSupport' })
  update(
    @Payload('userId') userId: string,
    @Payload('updateSupportDto') updateSupportDto: UpdateSupportDto,
  ) {
    return this.supportService.update(
      userId,
      updateSupportDto.id,
      updateSupportDto,
    );
  }

  @MessagePattern({ cmd: 'removeSupport' })
  remove(@Payload('userId') userId: string, @Payload() id: string) {
    return this.supportService.remove(userId, id);
  }

  @MessagePattern({ cmd: 'createMessage' })
  createMessage(
    @Payload('userId') userId: string,
    @Payload() id: string,
    @Payload() message: string,
  ) {
    return this.supportService.createMessage(userId, id, message);
  }

  @MessagePattern({ cmd: 'findOneMessages' })
  findOneMessages(@Payload('userId') userId: string, @Payload() id: string) {
    return this.supportService.findOneMessages(userId, id);
  }

  @MessagePattern({ cmd: 'updateStatus' })
  updateStatus(
    @Payload('userId') userId: string,
    @Payload() id: string,
    @Payload() status: string,
  ) {
    return this.supportService.updateStatus(userId, id, status);
  }
}
