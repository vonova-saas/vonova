import { Body, Controller, Get, Param, Put, Req } from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateUserAccountDto } from './dto/account.dto';

@Controller('account')
export class AccountController {



 constructor(private readonly userAccountService: AccountService) {}

  @Get(':userId')
  async getAccount(@Param('userId') userId: string, @Req() req: any) {
    const name = req.headers['x-user-name'] || '';
    const email = req.headers['x-user-email'] || '';

    const account = await this.userAccountService.getUserAccount(userId, { name, email });
    return {
      message: 'User account fetched successfully',
      data: account,
    };
  }

@Put(':userId')
  async updateAccount(
    @Param('userId') userId: string,
    @Body() body: UpdateUserAccountDto,
  ) {
    const account = await this.userAccountService.updateUserAccount(userId, body);
    return {
      message: 'User account updated successfully',
      data: account,
    };
  }

}
