import BookModel, { BookDocument } from "../../models/library/book.model";
import BookProgressModel from "../../models/library/bookProgress.model";
import { BadRequestException, ForbiddenException, NotFoundException } from "../../utils/appError";

export const createBookService = async (data: Partial<BookDocument>, userId: string) => {
  const book = await BookModel.create({
    ...data,
    createdBy: userId
  });

  if (!book) {
    throw new BadRequestException("Book not created");
  }

  return book;
};

export const publishBookService = async (id: string, data: Partial<BookDocument>, userId: string) => {
  const book = await BookModel.findById(id);
  if (!book) {
    throw new NotFoundException("Book not found");
  }

  if (book.createdBy.toString() !== userId) {
    throw new ForbiddenException("You are not authorized to publish this book");
  }

  const updatedBook = await BookModel.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );

  if (!updatedBook) {
    throw new BadRequestException("Book not published");
  }

  return updatedBook;
};

export const getBooksService = async (query: {
  q?: string;
  topics?: string[];
  level?: string;
  sort?: string;
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const { q, topics, level, sort = "new", page = 1, limit = 12, status } = query;

  const filter: any = {};

  if (status) filter.status = status;
  if (q) filter.$text = { $search: q };
  if (topics && topics.length) filter.topics = { $in: topics };
  if (level) filter.level = level;

  const sortMap: Record<string, any> = {
    new: { createdAt: -1 },
    popular: { "metrics.favoritesCount": -1 },
    rating: { "metrics.ratingAverage": -1 },
  };

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    BookModel.find(filter).sort(sortMap[sort] || sortMap.new).skip(skip).limit(limit),
    BookModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages
  };
};

export const getBookByIdService = async (id: string) => {
  const book = await BookModel.findById(id);
  if (!book) {
    throw new NotFoundException("Book not found");
  }

  return book;
};

export const getBookBySlugService = async (slug: string) => {
  const book = await BookModel.findOne({ slug });
  if (!book) {
    throw new NotFoundException("Book not found");
  }

  return book;
};

export const getMyBookProgressService = async (bookId: string, userId: string) => {
  const progressBook = await BookProgressModel.findOne({ userId, bookId });
  if (!progressBook) {
    return { lastPage: 0, timeSpentSec: 0, completed: false };
  }

  return {
    lastPage: progressBook.lastPage,
    timeSpentSec: progressBook.timeSpentSec,
    completed: progressBook.completed
  };
};

export const updateBookService = async (id: string, data: Partial<BookDocument>, userId: string) => {
  const book = await BookModel.findById(id);
  if (!book) {
    throw new NotFoundException("Book not found");
  }

  if (book.createdBy.toString() !== userId) {
    throw new ForbiddenException("You are not authorized to update this book");
  }

  const updatedBook = await BookModel.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );

  if (!updatedBook) {
    throw new BadRequestException("Book not updated");
  }

  return updatedBook;
};

export const updateBookProgressService = async (
  bookId: string,
  userId: string,
  payload: { lastPage: number; timeSpentSec?: number; completed?: boolean }
) => {
  const book = await BookModel.findById(bookId);
  if (!book) throw new NotFoundException("Book not found");

  const update: any = { lastPage: payload.lastPage };
  if (payload.timeSpentSec) {
    update.$inc = { timeSpentSec: payload.timeSpentSec };
  }

  if (payload.completed !== undefined) {
    update.completed = payload.completed;
    update.completedAt = payload.completed ? new Date() : undefined;
  }

  const progressBook = await BookProgressModel.findOneAndUpdate(
    { userId, bookId },
    { $set: { lastPage: payload.lastPage, completed: !!payload.completed, completedAt: payload.completed ? new Date() : undefined }, $inc: { timeSpentSec: payload.timeSpentSec || 0 } },
    { new: true, upsert: true }
  );

  return progressBook;
};

export const deleteBookService = async (id: string, userId: string) => {
  const book = await BookModel.findById(id);
  if (!book) {
    throw new NotFoundException("Book not found");
  }

  if (book.createdBy.toString() !== userId) {
    throw new ForbiddenException("You are not authorized to delete this book");
  }

  const deletedBook = await BookModel.findByIdAndDelete(id);

  if (!deletedBook) {
    throw new BadRequestException("Book not deleted");
  }
};