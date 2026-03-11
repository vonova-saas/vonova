/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BookService } from './book.service';
import { Book, BookDocument } from '../schema/book/book.schema';
import { Types } from 'mongoose';
import {
  BookProgress,
  BookProgressDocument,
} from '../schema/book/book-progress.schema';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateBookDto,
  PublishBookDto,
  UpdateBookDto,
  UpdateProgressDto,
} from './dto/book.dto';

describe('BookService', () => {
  let service: BookService;
  let bookModelMock: {
    create: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let bookProgressModelMock: {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    bookModelMock = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    bookProgressModelMock = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: getModelToken(Book.name),
          useValue: bookModelMock,
        },
        {
          provide: getModelToken(BookProgress.name),
          useValue: bookProgressModelMock,
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBookService', () => {
    it('should create a book for a user', async () => {
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
      const created = { _id: 'b1', ...dto } as unknown as Partial<BookDocument>;
      bookModelMock.create.mockResolvedValue(created);

      const result = await service.createBookService(dto, 'user1');

      expect(bookModelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: dto.title, createdBy: 'user1' }),
      );
      expect(result).toEqual(created);
    });

    it('should throw BadRequestException when book not created', async () => {
      const dto = { title: 'Book 1', slug: 'book-1' } as CreateBookDto;
      bookModelMock.create.mockResolvedValue(null);

      await expect(service.createBookService(dto, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('publishBookService', () => {
    it('should publish book when user is owner', async () => {
      const id = 'book-id';
      const dto: PublishBookDto = { status: 'PUBLISHED' };
      const book = { _id: id, createdBy: { toString: () => 'user1' } };
      const updated = { _id: 'book-id', status: 'PUBLISHED' } as unknown as Partial<BookDocument>;
      bookModelMock.findById.mockResolvedValue(book);
      bookModelMock.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.publishBookService(id, dto, 'user1');

      expect(bookModelMock.findById).toHaveBeenCalledWith(id);
      expect(bookModelMock.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when book not found', async () => {
      bookModelMock.findById.mockResolvedValue(null);

      await expect(
        service.publishBookService('missing', { status: 'PUBLISHED' }, 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const book = { createdBy: { toString: () => 'other-user' } };
      bookModelMock.findById.mockResolvedValue(book);

      await expect(
        service.publishBookService('id', { status: 'PUBLISHED' }, 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getBooksService', () => {
    it('should build filter and return paginated books', async () => {
      const query = {
        q: 'search',
        topics: ['math'],
        level: 'Beginner',
        sort: 'new',
        page: 1,
        limit: 10,
        status: 'PUBLISHED',
      };
      const items = [] as Partial<BookDocument>[];
      bookModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(items),
      } as any);
      bookModelMock.countDocuments.mockResolvedValue(0);

      const result = await service.getBooksService(query);

      expect(bookModelMock.countDocuments).toHaveBeenCalled();
      expect(result).toEqual({
        items,
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });
  });

  describe('getBookByIdService', () => {
    it('should return book when found', async () => {
      const id = 'book-id';
      const book = { _id: id } as unknown as Partial<BookDocument>;
      bookModelMock.findById.mockResolvedValue(book);

      const result = await service.getBookByIdService(id);

      expect(bookModelMock.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(book);
    });

    it('should throw NotFoundException when book not found', async () => {
      bookModelMock.findById.mockResolvedValue(null);

      await expect(service.getBookByIdService('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBookBySlugService', () => {
    it('should return book when found by slug', async () => {
      const slug = 'book-1';
      const book = { slug } as Partial<BookDocument>;
      bookModelMock.findOne.mockResolvedValue(book);

      const result = await service.getBookBySlugService(slug);

      expect(bookModelMock.findOne).toHaveBeenCalledWith({ slug });
      expect(result).toEqual(book);
    });

    it('should throw NotFoundException when not found', async () => {
      bookModelMock.findOne.mockResolvedValue(null);

      await expect(service.getBookBySlugService('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateBookService', () => {
    it('should update book when user is owner', async () => {
      const id = 'book-id';
      const dto: UpdateBookDto = { title: 'Updated' } as UpdateBookDto;
      const book = { createdBy: { toString: () => 'user1' } };
      const updated = { _id: 'book-id', ...dto } as unknown as Partial<BookDocument>;
      bookModelMock.findById.mockResolvedValue(book);
      bookModelMock.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.updateBookService(id, dto, 'user1');

      expect(bookModelMock.findById).toHaveBeenCalledWith(id);
      expect(bookModelMock.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when book not found', async () => {
      bookModelMock.findById.mockResolvedValue(null);

      await expect(
        service.updateBookService('missing', {} as UpdateBookDto, 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const book = { createdBy: { toString: () => 'other-user' } };
      bookModelMock.findById.mockResolvedValue(book);

      await expect(
        service.updateBookService('id', {} as UpdateBookDto, 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteBookService', () => {
    it('should delete book when user is owner', async () => {
      const id = 'book-id';
      const book = { createdBy: { toString: () => 'user1' } };
      bookModelMock.findById.mockResolvedValue(book);
      bookModelMock.findByIdAndDelete.mockResolvedValue({ _id: id } as any);

      const result = await service.deleteBookService(id, 'user1');

      expect(bookModelMock.findById).toHaveBeenCalledWith(id);
      expect(bookModelMock.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(result).toEqual({ message: 'Book deleted successfully' });
    });

    it('should throw NotFoundException when book not found', async () => {
      bookModelMock.findById.mockResolvedValue(null);

      await expect(
        service.deleteBookService('missing', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const book = { createdBy: { toString: () => 'other-user' } };
      bookModelMock.findById.mockResolvedValue(book);

      await expect(service.deleteBookService('id', 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getMyBookProgressService', () => {
    it('should return default progress when none exists', async () => {
      bookProgressModelMock.findOne.mockResolvedValue(null);

      const result = await service.getMyBookProgressService('book-id', 'user1');

      expect(bookProgressModelMock.findOne).toHaveBeenCalledWith({
        userId: 'user1',
        bookId: 'book-id',
      });
      expect(result).toEqual({
        lastPage: 0,
        timeSpentSec: 0,
        completed: false,
      });
    });

    it('should return existing progress when found', async () => {
      const progress = {
        lastPage: 5,
        timeSpentSec: 120,
        completed: false,
      } as Partial<BookProgressDocument>;
      bookProgressModelMock.findOne.mockResolvedValue(progress);

      const result = await service.getMyBookProgressService('book-id', 'user1');

      expect(result).toEqual({
        lastPage: 5,
        timeSpentSec: 120,
        completed: false,
      });
    });
  });

  describe('updateBookProgressService', () => {
    it('should update or create progress entry', async () => {
      const bookId = 'book-id';
      const userId = 'user1';
      const dto: UpdateProgressDto = {
        lastPage: 10,
        timeSpentSec: 30,
        completed: true,
      };
      const book = { _id: 'book-id' } as unknown as Partial<BookDocument>;
      const progress = {
        userId: 'user1',
        bookId: 'book-id',
        lastPage: 10,
        timeSpentSec: 30,
        completed: true,
      } as unknown as Partial<BookProgressDocument>;
      bookModelMock.findById.mockResolvedValue(book);
      bookProgressModelMock.findOneAndUpdate.mockResolvedValue(progress);

      const result = await service.updateBookProgressService(
        bookId,
        userId,
        dto,
      );

      expect(bookModelMock.findById).toHaveBeenCalledWith(bookId);
      expect(bookProgressModelMock.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(progress);
    });

    it('should throw NotFoundException when book not found', async () => {
      bookModelMock.findById.mockResolvedValue(null);

      await expect(
        service.updateBookProgressService('missing', 'user1', {
          lastPage: 1,
        } as UpdateProgressDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
