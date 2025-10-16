import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import * as bookService from "../../services/library/book.service";

export const createBookController = asyncHandler(
  async (req: Request, res: Response) => {
    const book = await bookService.createBookService(req.body, req.user!.id);

    res.status(HTTPSTATUS.CREATED).json({
      message: "Book created successfully",
      data: book
    });
  }
);

export const publishBookController = asyncHandler(
  async (req: Request, res: Response) => {
    const book = await bookService.publishBookService(req.params.id, req.body, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Book published successfully",
      data: book
    });
  }
);

export const getBooksController = asyncHandler(
  async (req: Request, res: Response) => {
    const books = await bookService.getBooksService({
      q: req.query.q as string,
      topics: req.query.topics ? String(req.query.topics).split(',') : undefined,
      level: req.query.level as string,
      sort: req.query.sort as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 12,
      status: req.query.status as string,
    });

    res.status(HTTPSTATUS.OK).json({
      message: "Books retrieved successfully",
      data: books
    });
  });

export const getBookByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const book = await bookService.getBookByIdService(req.params.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Book retrieved successfully",
      data: book
    });
  }
);

export const getBookBySlugController = asyncHandler(
  async (req: Request, res: Response) => {
    const book = await bookService.getBookBySlugService(req.params.slug);

    res.status(HTTPSTATUS.OK).json({
      message: "Book retrieved successfully",
      data: book
    });
  }
);

// S3
export const getMyBookProgressController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await bookService.getMyBookProgressService(req.params.bookId, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Book progress retrieved successfully",
      data
    });
  }
);

export const updateBookController = asyncHandler(
  async (req: Request, res: Response) => {
    const book = await bookService.updateBookService(req.params.id, req.body, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Book updated successfully",
      data: book
    });
  }
);

export const updateBookProgressController = asyncHandler(
  async (req: Request, res: Response) => {
    const progressBook = await bookService.updateBookProgressService(
      req.params.bookId,
      req.user!.id,
      { lastPage: req.body.lastPage, timeSpentSec: req.body.timeSpentSec, completed: req.body.completed }
    );

    res.status(HTTPSTATUS.OK).json({
      message: "Book progress updated successfully",
      data: progressBook
    });
  }
);

export const deleteBookController = asyncHandler(
  async (req: Request, res: Response) => {
    await bookService.deleteBookService(req.params.id, req.user!.id);

    res.status(HTTPSTATUS.OK).json({
      message: "Book deleted successfully"
    });
  }
);
