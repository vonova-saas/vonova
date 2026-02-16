import { Controller, Get, Post, Param, Body, Req, HttpCode } from '@nestjs/common';
import { ReaderService } from './reader.service';
import { UpdateBookProgressDto } from './dto/reader.dto';



@Controller('library')
export class ReaderController {
constructor(private readonly readerService: ReaderService) {}


// GET /library/books/:bookId/content
@Get('books/:bookId/content')
async getBookContent(@Param('bookId') bookId: string, @Req() req: any) {
const userId = req.user?.id || req.headers['x-user-id'];
const data = await this.readerService.getBookContent(bookId, userId);
return { message: 'Book content', data };
}

@Get('guides/:guideId/content')
async getGuideContent(@Param('guideId') guideId: string) {
const data = await this.readerService.getGuideContent(guideId);
return { message: 'Guide content', data };
}



@Get('presentations/:presentationId/content')
async getPresentationContent(@Param('presentationId') presentationId: string) {
const data = await this.readerService.getPresentationContent(presentationId);
return { message: 'Presentation content', data };
}


@Post('books/:bookId/progress')
@HttpCode(200)
async updateBookProgress(@Param('bookId') bookId: string, @Body() dto: UpdateBookProgressDto, @Req() req: any) {
const userId = req.user?.id || req.headers['x-user-id'];
const doc = await this.readerService.updateBookProgress(bookId, userId, dto as any);
return { message: 'Progress updated', data: doc };
}



@Get('books/:bookId/progress/me')
async getMyBookProgress(@Param('bookId') bookId: string, @Req() req: any) {
const userId = req.user?.id || req.headers['x-user-id'];
const data = await this.readerService.getMyBookProgress(bookId, userId);
return { message: 'My progress', data };
}
}