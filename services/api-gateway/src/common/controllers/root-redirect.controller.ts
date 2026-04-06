import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class RootRedirectController {
  @Get()
  @Redirect('/api/v1/docs', 302)
  redirectToDocs() {
    return;
  }
}
