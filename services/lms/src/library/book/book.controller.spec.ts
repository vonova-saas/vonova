import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import {
  CreateBookDto,
  GetBooksQueryDto,
  PublishBookDto,
  UpdateBookDto,
  UpdateProgressDto,
} from './dto/book.dto';

describe('BookController', () => {
  let controller: BookController;
  let bookServiceMock: {
    createBookService: jest.Mock;
    publishBookService: jest.Mock;
    getBooksService: jest.Mock;
    getBookByIdService: jest.Mock;
    getBookBySlugService: jest.Mock;
    updateBookService: jest.Mock;
    updateBookProgressService: jest.Mock;
    deleteBookService: jest.Mock;
  };

  beforeEach(async () => {
    bookServiceMock = {
      createBookService: jest.fn(),
      publishBookService: jest.fn(),
      getBooksService: jest.fn(),
      getBookByIdService: jest.fn(),
      getBookBySlugService: jest.fn(),
      updateBookService: jest.fn(),
      updateBookProgressService: jest.fn(),
      deleteBookService: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        {
          provide: BookService,
          useValue: bookServiceMock,
        },
      ],
    }).compile();

    controller = module.get<BookController>(BookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBook', () => {
    it('should delegate to bookService.createBookService', async () => {
      const dto: CreateBookDto = {
        title: 'Book 1',
        slug: 'book-1',
        summary: 'Summary',
        description: 'Desc',
        authors: [],
        topics: [],
        level: 'Beginner',
        coverUrl: undefined,
        language: 'en',
        badges: [],
        pageCount: 0,
        readingTimeMin: 0,
      };
      const created = { id: 'b1', ...dto };
      bookServiceMock.createBookService.mockResolvedValue(created);

      const result = await controller.createBook(dto);

      expect(bookServiceMock.createBookService).toHaveBeenCalledWith(
        dto,
        'USER_ID',
      );
      expect(result).toEqual(created);
    });
  });

  describe('publishBook', () => {
    it('should delegate to bookService.publishBookService', async () => {
      const id = 'book-id';
      const dto: PublishBookDto = { status: 'PUBLISHED' };
      const updated = { id, status: 'PUBLISHED' };
      bookServiceMock.publishBookService.mockResolvedValue(updated);

      const result = await controller.publishBook(id, dto);

      expect(bookServiceMock.publishBookService).toHaveBeenCalledWith(
        id,
        dto,
        'USER_ID',
      );
      expect(result).toEqual(updated);
    });
  });

  describe('getBooks', () => {
    it('should delegate to bookService.getBooksService', async () => {
      const query: GetBooksQueryDto = {
        q: 'test',
        topics: 'math,science',
        level: 'Beginner',
        sort: 'new',
        page: 1,
        limit: 10,
        status: 'PUBLISHED',
      };
      const expected = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      bookServiceMock.getBooksService.mockResolvedValue(expected);

      const result = await controller.getBooks(query);

      expect(bookServiceMock.getBooksService).toHaveBeenCalledWith({
        ...query,
        topics: ['math', 'science'],
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getBookById', () => {
    it('should delegate to bookService.getBookByIdService', async () => {
      const id = 'book-id';
      const expected = { id };
      bookServiceMock.getBookByIdService.mockResolvedValue(expected);

      const result = await controller.getBookById(id);

      expect(bookServiceMock.getBookByIdService).toHaveBeenCalledWith(id);
      expect(result).toEqual(expected);
    });
  });

  describe('getBookBySlug', () => {
    it('should delegate to bookService.getBookBySlugService', async () => {
      const slug = 'book-slug';
      const expected = { slug };
      bookServiceMock.getBookBySlugService.mockResolvedValue(expected);

      const result = await controller.getBookBySlug(slug);

      expect(bookServiceMock.getBookBySlugService).toHaveBeenCalledWith(slug);
      expect(result).toEqual(expected);
    });
  });

  describe('updateBook', () => {
    it('should delegate to bookService.updateBookService', async () => {
      const id = 'book-id';
      const dto: UpdateBookDto = { title: 'Updated' } as UpdateBookDto;
      const expected = { id, ...dto };
      bookServiceMock.updateBookService.mockResolvedValue(expected);

      const result = await controller.updateBook(id, dto);

      expect(bookServiceMock.updateBookService).toHaveBeenCalledWith(
        id,
        dto,
        'USER_ID',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('updateBookProgress', () => {
    it('should delegate to bookService.updateBookProgressService', async () => {
      const bookId = 'book-id';
      const dto: UpdateProgressDto = { lastPage: 10, timeSpentSec: 60 };
      const expected = { bookId, ...dto };
      bookServiceMock.updateBookProgressService.mockResolvedValue(expected);

      const result = await controller.updateBookProgress(bookId, dto);

      expect(bookServiceMock.updateBookProgressService).toHaveBeenCalledWith(
        bookId,
        'USER_ID',
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('deleteBook', () => {
    it('should delegate to bookService.deleteBookService', async () => {
      const id = 'book-id';
      const expected = { message: 'Book deleted successfully' };
      bookServiceMock.deleteBookService.mockResolvedValue(expected);

      const result = await controller.deleteBook(id);

      expect(bookServiceMock.deleteBookService).toHaveBeenCalledWith(
        id,
        'USER_ID',
      );
      expect(result).toEqual(expected);
    });
  });
});
