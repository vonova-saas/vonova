import { Controller, Get, Res, HttpCode, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

/** Serves GET /favicon.ico with 204 so browsers do not trigger 404 logs. */
@Controller()
export class FaviconController {
  @Get('favicon.ico')
  @HttpCode(HttpStatus.NO_CONTENT)
  favicon(@Res() res: Response) {
    res.status(204).end();
  }
}
