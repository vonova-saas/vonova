import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../../../schemas/library/book/book.schema';
import { BookProgress, BookProgressDocument } from '../../../schemas/library/book/book-progress.schema';
import { CreateBookDto, UpdateBookDto, PublishBookDto, UpdateProgressDto } from './dto/book.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(BookProgress.name) private readonly bookProgressModel: Model<BookProgressDocument>,
  ) {}

  async createBookService(data: CreateBookDto, userId: string) {
    const book = await this.bookModel.create({ ...data, createdBy: userId });
    if (!book) throw new BadRequestException('Book not created');
    return book;
  }

  async publishBookService(id: string, data: PublishBookDto, userId: string) {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    if (book.createdBy.toString() !== userId) throw new ForbiddenException('You are not authorized to publish this book');

    const updatedBook = await this.bookModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updatedBook) throw new BadRequestException('Book not published');
    return updatedBook;
  }

  async getBooksService(query: { q?: string; topics?: string[]; level?: string; sort?: string; page?: number; limit?: number; status?: string }) {
    const { q, topics, level, sort = 'new', page = 1, limit = 12, status } = query;
    const filter: any = {};
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };
    if (topics && topics.length) filter.topics = { $in: topics };
    if (level) filter.level = level;

    const sortMap: Record<string, any> = {
      new: { createdAt: -1 },
      popular: { 'metrics.favoritesCount': -1 },
      rating: { 'metrics.ratingAverage': -1 },
    };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.bookModel.find(filter).sort(sortMap[sort] || sortMap.new).skip(skip).limit(limit),
      this.bookModel.countDocuments(filter),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBookByIdService(id: string) {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async getBookBySlugService(slug: string) {
    const book = await this.bookModel.findOne({ slug });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async updateBookService(id: string, data: UpdateBookDto, userId: string) {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    if (book.createdBy.toString() !== userId) throw new ForbiddenException('You are not authorized to update this book');

    const updatedBook = await this.bookModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updatedBook) throw new BadRequestException('Book not updated');
    return updatedBook;
  }

  async deleteBookService(id: string, userId: string) {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    if (book.createdBy.toString() !== userId) throw new ForbiddenException('You are not authorized to delete this book');

    const deletedBook = await this.bookModel.findByIdAndDelete(id);
    if (!deletedBook) throw new BadRequestException('Book not deleted');
    return {message: 'Book deleted successfully'};
  }

  async getMyBookProgressService(bookId: string, userId: string) {
    const progressBook = await this.bookProgressModel.findOne({ userId, bookId });
    if (!progressBook) return { lastPage: 0, timeSpentSec: 0, completed: false };
    return { lastPage: progressBook.lastPage, timeSpentSec: progressBook.timeSpentSec, completed: progressBook.completed };
  }

  async updateBookProgressService(bookId: string, userId: string, payload: UpdateProgressDto) {
    const book = await this.bookModel.findById(bookId);
    if (!book) throw new NotFoundException('Book not found');

    const progressBook = await this.bookProgressModel.findOneAndUpdate(
      { userId, bookId },
      { $set: { lastPage: payload.lastPage, completed: !!payload.completed, completedAt: payload.completed ? new Date() : undefined }, $inc: { timeSpentSec: payload.timeSpentSec || 0 } },
      { new: true, upsert: true },
    );
    return progressBook;
  }
}
