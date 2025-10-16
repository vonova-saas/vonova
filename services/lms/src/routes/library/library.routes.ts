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
import { listGuidesController, getGuideBySlugController, getGuideByIdController, createGuideController, updateGuideController, publishGuideController, deleteGuideController } from "../../controllers/library/guide.controller";
import { createGuideSchema, updateGuideSchema, publishGuideSchema } from "../../validation/library/guide.validation";
import { securityStack } from "../../middlewares/security";
import { libraryProcessingWebhookSchema } from "../../validation/library/processing.validation";
import { getGuideContentService, getPresentationContentService } from "../../services/library/reader.service";
import { getBookContentController, getMyBookProgressController, updateBookProgressController } from "../../controllers/library/reader.controller";
import { updateBookProgressSchema } from "../../validation/library/reader.validation";
import { libraryReviewSchema } from "../../validation/library/review.validation";
import { createOrUpdateLibraryReviewController, getMyLibraryReviewController, listLibraryReviewsController } from "../../controllers/library/review.controller";
import { libraryProcessingWebhookController } from "../../controllers/library/processing.controller";
import { completeLibraryFileSchema, presignLibraryFileSchema } from "../../validation/library/upload.validation";
import { completeLibraryFileController, presignLibraryFileController } from "../../controllers/library/upload.controller";

// hasPermission(Permissions.CREATE_LIBRARY_ITEM)
const libraryRouter = Router();

// Apply security stack to all auth routes
// Apply security stack to all auth routes
libraryRouter.use(...securityStack);

// Apply authentication to all Feedback routes
libraryRouter.use(isAuthenticatedOrSignedContext);

// ========== Books ==========
libraryRouter.post(
  '/book/createBook',
  validateRequest(createBookSchema),
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  bookController.createBookController
);

libraryRouter.patch(
  '/book/publishBook/:id',
  validateRequest(publishBookSchema),
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  bookController.publishBookController
);

libraryRouter.get(
  '/book/getAllBooks',
  bookController.getBooksController
);

libraryRouter.get(
  '/book/getBookById/:id',
  bookController.getBookByIdController
);

libraryRouter.get(
  '/book/slug/:slug',
  bookController.getBookBySlugController
);

libraryRouter.patch(
  '/book/updateBook/:id',
  validateRequest(updateBookSchema),
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  bookController.updateBookController
);

libraryRouter.post(
  '/book/:bookId/progress',
  bookController.updateBookProgressController
);

libraryRouter.delete(
  '/book/deleteBook/:id',
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  bookController.deleteBookController
);

// ========== Guides ==========
libraryRouter.get(
  '/guides',
  listGuidesController
);

libraryRouter.get(
  '/guides/slug/:slug',
  getGuideBySlugController
);

libraryRouter.get(
  '/guides/:id',
  getGuideByIdController
);

libraryRouter.post(
  '/guides',
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  validateRequest(createGuideSchema),
  createGuideController
);

libraryRouter.patch(
  '/guides/:id',
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  validateRequest(updateGuideSchema),
  updateGuideController
);

libraryRouter.patch(
  '/guides/:id/publish',
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  validateRequest(publishGuideSchema),
  publishGuideController
);

libraryRouter.delete(
  '/guides/:id',
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  deleteGuideController
);

// ========== Presentations ==========
libraryRouter.post(
  '/presentation/createPresentation',
  validateRequest(createPresentationSchema),
  presentationController.createPresentation
);

libraryRouter.patch(
  '/presentation/updatePresentation/:id',
  validateRequest(updatePresentationSchema),
  presentationController.updatePresentation
);

libraryRouter.patch(
  '/presentation/publishPresentation/:id',
  validateRequest(publishPresentationSchema),
  presentationController.publishPresentation
);

libraryRouter.delete(
  '/presentation/deletePresentation/:id',
  presentationController.deletePresentation
);

libraryRouter.get(
  '/presentation/getAllPresentations',
  presentationController.getPresentations
);

libraryRouter.get(
  '/presentation/getPresentationById/:id',
  presentationController.getPresentationById
);

libraryRouter.get(
  '/presentation/:presentationId/content',
  presentationController.getPresentationContent
);

// ========== Favorites ==========
libraryRouter.post(
  '/favorite/:itemType/:itemId',
  favoriteController.createFavorite
);

libraryRouter.delete(
  '/favorite/:itemType/:itemId',
  favoriteController.deleteFavorite
);

libraryRouter.get(
  '/favorite/me',
  favoriteController.getMyFavorites
);

// ========== Uploads (Books/Guides/Presentations) ==========
libraryRouter.post(
  "/items/:itemType/:itemId/file/presign",
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  validateRequest(presignLibraryFileSchema),
  presignLibraryFileController
);

libraryRouter.post(
  "/items/:itemType/:itemId/file/complete",
  hasPermission(Permissions.MANAGE_LIBRARY_ITEM),
  validateRequest(completeLibraryFileSchema),
  completeLibraryFileController
);

// ========== Reader & Progress (Books) ==========
libraryRouter.get(
  "/books/:bookId/content",
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  getBookContentController
);

// Simple inline handlers for guide/presentation content to avoid extra controller files
libraryRouter.get(
  "/guides/:guideId/content",
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  async (req, res, next) => {
    try {
      const data = await getGuideContentService(req.params.guideId);
      res.json({ message: "Guide content", data });
    } catch (e) { next(e); }
  }
);

libraryRouter.get(
  "/presentations/:presentationId/content",
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  async (req, res, next) => {
    try {
      const data = await getPresentationContentService(req.params.presentationId);
      res.json({ message: "Presentation content", data });
    } catch (e) { next(e); }
  }
);

libraryRouter.post(
  "/books/:bookId/progress",
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  validateRequest(updateBookProgressSchema),
  updateBookProgressController
);

libraryRouter.get(
  "/books/:bookId/progress/me",
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  getMyBookProgressController
);

// ========== Reviews ==========
libraryRouter.post(
  "/items/:itemType/:itemId/reviews",
  hasPermission(Permissions.WRITE_LIBRARY_REVIEW),
  validateRequest(libraryReviewSchema),
  createOrUpdateLibraryReviewController
);

libraryRouter.get(
  "/items/:itemType/:itemId/reviews",
  listLibraryReviewsController
);

libraryRouter.get(
  "/items/:itemType/:itemId/reviews/me",
  hasPermission(Permissions.WRITE_LIBRARY_REVIEW),
  getMyLibraryReviewController
);

// ========== Processing Webhook (optional) ==========
libraryRouter.post(
  "/webhooks/library-file-processed",
  validateRequest(libraryProcessingWebhookSchema),
  libraryProcessingWebhookController
);

export default libraryRouter;