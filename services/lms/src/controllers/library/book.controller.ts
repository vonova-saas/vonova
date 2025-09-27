import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/api/asyncHandler.middleware";
import { HTTPSTATUS } from "../../config/http.config";
import * as bookService from "../../services/library/book.service";



export const createBook = asyncHandler(async (req: Request, res: Response) => {
    const doc = await bookService.createBook(req.body, req.user!.id);
    res.status(HTTPSTATUS.CREATED).json({ message: "Book created", data: doc });
  });


  export const updateBook = asyncHandler(async (req: Request, res: Response) => {
    const doc = await bookService.updateBook(req.params.id, req.body, req.user!.id);
    res.status(HTTPSTATUS.OK).json({ message: "Book updated", data: doc });
  });


  export const publishBook = asyncHandler(async (req: Request, res: Response) => {
    const doc = await bookService.publishBook(req.params.id, req.body, req.user!.id);
    res.status(HTTPSTATUS.OK).json({ message: "Book published", data: doc });
  });

  export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
    const doc = await bookService.deleteBook(req.params.id, req.user!.id);
    res.status(HTTPSTATUS.OK).json({ message: "Book deleted", data: doc });
  });

  export const getBooks = asyncHandler(async (req: Request, res: Response) => {
    const { items, total, page, limit, totalPages } = await bookService.getBooks({
      q: req.query.q as string,
      topics: req.query.topics ? String(req.query.topics).split(',') : undefined,
      level: req.query.level as string,
      sort: req.query.sort as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 12,
      status: req.query.status as string,
    });
  
    res.status(HTTPSTATUS.OK).json({
      message: "Books",
      data: { items, total, page, limit, totalPages },
    });
  });
  
  

  export const getBookById = asyncHandler(async (req: Request, res: Response) => {
    const doc = await bookService.getBookById(req.params.id);
    res.status(HTTPSTATUS.OK).json({ message: "Book", data: doc });
  });


  
  export const updateBookProgress = asyncHandler(async (req: Request, res: Response) => {
    const doc = await bookService.updateBookProgress(
      req.params.bookId,
      req.user!.id,
      { lastPage: req.body.lastPage, timeSpentSec: req.body.timeSpentSec, completed: req.body.completed }
    );
    res.status(HTTPSTATUS.OK).json({ message: "Progress updated", data: doc });
  });


export const getBookBySlug = asyncHandler(async (req: Request, res: Response) => {
  const doc = await bookService.getBookBySlug(req.params.slug);
  res.status(HTTPSTATUS.OK).json({ message: "Book", data: doc });
});



  ///////////////////////////////S3/////////////////////////////////////////////
  // export const getMyBookProgress = asyncHandler(async (req: Request, res: Response) => {
  //   const data = await bookService.getMyBookProgress(req.params.bookId, req.user!.id);
  //   res.status(HTTPSTATUS.OK).json({ message: "My progress", data });
  // });
  