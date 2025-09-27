import { Router } from "express";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { validateRequest } from "../../middlewares/validation/validateRequest.middleware";
import { createBookSchema, publishBookSchema, updateBookSchema } from "../../validation/library/book.validation";
import * as bookController from "../../controllers/library/book.controller";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import { createPresentationSchema, publishPresentationSchema, updatePresentationSchema } from "../../validation/library/presentation.validation";
import * as presentationController from "../../controllers/library/presentation.controller";
import * as favoriteController from "../../controllers/library/favorite.controller";


// hasPermission(Permissions.CREATE_LIBRARY_ITEM)
const libraryRouter = Router();
//////////////////////////////////  BOOKS //////////////////////////////////

libraryRouter.post('/book/createBook' , isAuthenticatedOrSignedContext , validateRequest(createBookSchema) , bookController.createBook)

libraryRouter.patch('/book/updateBook/:id' , isAuthenticatedOrSignedContext , validateRequest(updateBookSchema) , bookController.updateBook)

libraryRouter.patch('/book/publishBook/:id' , isAuthenticatedOrSignedContext , validateRequest(publishBookSchema) , bookController.publishBook)

libraryRouter.delete('/book/deleteBook/:id' , isAuthenticatedOrSignedContext , bookController.deleteBook)

libraryRouter.get('/book/getAllBooks' , isAuthenticatedOrSignedContext , bookController.getBooks)

libraryRouter.get('/book/getBookById/:id' , isAuthenticatedOrSignedContext , bookController.getBookById)

libraryRouter.get('/book/slug/:slug',isAuthenticatedOrSignedContext,bookController.getBookBySlug)


libraryRouter.post('/book/:bookId/progress' , isAuthenticatedOrSignedContext , bookController.updateBookProgress)

/////////////////////////S3/////////////////////////
// libraryRouter.get('/book/:bookId/progress/me' , isAuthenticatedOrSignedContext , bookController.getMyBookProgress)
//////////////////////////////////  PRESENTATIONS //////////////////////////////////

libraryRouter.post('/presentation/createPresentation' , isAuthenticatedOrSignedContext , validateRequest(createPresentationSchema) , presentationController.createPresentation)

libraryRouter.patch('/presentation/updatePresentation/:id' , isAuthenticatedOrSignedContext , validateRequest(updatePresentationSchema) , presentationController.updatePresentation)

libraryRouter.patch('/presentation/publishPresentation/:id' , isAuthenticatedOrSignedContext , validateRequest(publishPresentationSchema) , presentationController.publishPresentation)

libraryRouter.delete('/presentation/deletePresentation/:id' , isAuthenticatedOrSignedContext , presentationController.deletePresentation)

libraryRouter.get('/presentation/getAllPresentations' , isAuthenticatedOrSignedContext , presentationController.getPresentations)

libraryRouter.get('/presentation/getPresentationById/:id' , isAuthenticatedOrSignedContext , presentationController.getPresentationById)

// No test
libraryRouter.get('/presentation/:presentationId/content' , isAuthenticatedOrSignedContext , presentationController.getPresentationContent)

//////////////////////////////////  Favorites //////////////////////////////////

libraryRouter.post('/favorite/:itemType/:itemId' , isAuthenticatedOrSignedContext , favoriteController.createFavorite)

libraryRouter.delete('/favorite/:itemType/:itemId' , isAuthenticatedOrSignedContext , favoriteController.deleteFavorite)

libraryRouter.get('/favorite/me' , isAuthenticatedOrSignedContext , favoriteController.getMyFavorites)




export default libraryRouter;