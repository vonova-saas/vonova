import { Body, Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @MessagePattern({ cmd: 'findAccount' })
  findOne(@Payload('userId') userId: string) {
    return this.accountService.findOne(userId);
  }

  @MessagePattern({ cmd: 'updateAccount' })
  update(
    @Payload('userId') userId: string,
    @Payload('updateAccountDto') updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountService.update(userId, updateAccountDto);
  }
}
