import { Router } from "express";
import { isAuthenticatedOrSignedContext } from "../../middlewares/auth/verifySignedContext.middleware";
import { hasPermission } from "../../middlewares/auth/hasPermission.middleware";
import { Permissions } from "../../enums/permissions.enum";
import { validateRequest } from "../../middlewares/validateRequest.middleware";

// Books
import { createBookSchema, publishBookSchema, updateBookSchema } from "../../validation/library/book.validation";
import { createBookController, deleteBookController, getBookByIdController, getBookBySlugController, listBooksController, publishBookController, updateBookController } from "../../controllers/library/book.controller";

// Guides
import { createGuideSchema, publishGuideSchema, updateGuideSchema } from "../../validation/library/guide.validation";
import { createGuideController, deleteGuideController, getGuideByIdController, getGuideBySlugController, listGuidesController, publishGuideController, updateGuideController } from "../../controllers/library/guide.controller";

// Presentations
import { createPresentationSchema, publishPresentationSchema, updatePresentationSchema } from "../../validation/library/presentation.validation";
import { createPresentationController, deletePresentationController, getPresentationByIdController, getPresentationBySlugController, listPresentationsController, publishPresentationController, updatePresentationController } from "../../controllers/library/presentation.controller";
import { favoriteToggleSchema, updateBookProgressSchema } from "../../validation/library/reader.validation";
import { addFavoriteController, getBookContentController, getMyBookProgressController, listMyFavoritesController, removeFavoriteController, updateBookProgressController } from "../../controllers/library/reader.controller";
import { getGuideContentService, getPresentationContentService } from "../../services/library/reader.service";
import { presignLibraryFileController, completeLibraryFileController } from "../../controllers/library/upload.controller";
import { presignLibraryFileSchema, completeLibraryFileSchema } from "../../validation/library/upload.validation";
import { libraryReviewSchema } from "../../validation/library/review.validation";
import { createOrUpdateLibraryReviewController, getMyLibraryReviewController, listLibraryReviewsController } from "../../controllers/library/review.controller";
import { libraryProcessingWebhookSchema } from "../../validation/library/processing.validation";
import { libraryProcessingWebhookController } from "../../controllers/library/processing.controller";
import { requireInternalSecret } from "../../middlewares/auth/internalSecret.middleware";

const router = Router();

// ========== Books ==========
router.get("/books", listBooksController);
router.get("/books/slug/:slug", getBookBySlugController);
router.get("/books/:id", getBookByIdController);

router.post("/books", isAuthenticatedOrSignedContext, hasPermission(Permissions.CREATE_LIBRARY_ITEM), validateRequest(createBookSchema), createBookController);
router.patch("/books/:id", isAuthenticatedOrSignedContext, hasPermission(Permissions.EDIT_LIBRARY_ITEM), validateRequest(updateBookSchema), updateBookController);
router.patch("/books/:id/publish", isAuthenticatedOrSignedContext, hasPermission(Permissions.PUBLISH_LIBRARY_ITEM), validateRequest(publishBookSchema), publishBookController);
router.delete("/books/:id", isAuthenticatedOrSignedContext, hasPermission(Permissions.DELETE_LIBRARY_ITEM), deleteBookController);

// ========== Guides ==========
router.get("/guides", listGuidesController);
router.get("/guides/slug/:slug", getGuideBySlugController);
router.get("/guides/:id", getGuideByIdController);

router.post("/guides", isAuthenticatedOrSignedContext, hasPermission(Permissions.CREATE_LIBRARY_ITEM), validateRequest(createGuideSchema), createGuideController);
router.patch("/guides/:id", isAuthenticatedOrSignedContext, hasPermission(Permissions.EDIT_LIBRARY_ITEM), validateRequest(updateGuideSchema), updateGuideController);
router.patch("/guides/:id/publish", isAuthenticatedOrSignedContext, hasPermission(Permissions.PUBLISH_LIBRARY_ITEM), validateRequest(publishGuideSchema), publishGuideController);
router.delete("/guides/:id", isAuthenticatedOrSignedContext, hasPermission(Permissions.DELETE_LIBRARY_ITEM), deleteGuideController);

// ========== Presentations ==========
router.get("/presentations", listPresentationsController);
router.get("/presentations/slug/:slug", getPresentationBySlugController);
router.get("/presentations/:id", getPresentationByIdController);

router.post("/presentations", isAuthenticatedOrSignedContext, hasPermission(Permissions.CREATE_LIBRARY_ITEM), validateRequest(createPresentationSchema), createPresentationController);
router.patch("/presentations/:id", isAuthenticatedOrSignedContext, hasPermission(Permissions.EDIT_LIBRARY_ITEM), validateRequest(updatePresentationSchema), updatePresentationController);
router.patch("/presentations/:id/publish", isAuthenticatedOrSignedContext, hasPermission(Permissions.PUBLISH_LIBRARY_ITEM), validateRequest(publishPresentationSchema), publishPresentationController);
router.delete("/presentations/:id", isAuthenticatedOrSignedContext, hasPermission(Permissions.DELETE_LIBRARY_ITEM), deletePresentationController);

// ========== Uploads (Books/Guides/Presentations) ==========
router.post(
  "/items/:itemType/:itemId/file/presign",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.MANAGE_LIBRARY),
  validateRequest(presignLibraryFileSchema),
  presignLibraryFileController
);

router.post(
  "/items/:itemType/:itemId/file/complete",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.MANAGE_LIBRARY),
  validateRequest(completeLibraryFileSchema),
  completeLibraryFileController
);

// ========== Reader & Progress (Books) ==========
router.get(
  "/books/:bookId/content",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  getBookContentController
);

// Simple inline handlers for guide/presentation content to avoid extra controller files
router.get(
  "/guides/:guideId/content",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  async (req, res, next) => {
    try {
      const data = await getGuideContentService(req.params.guideId);
      res.json({ message: "Guide content", data });
    } catch (e) { next(e); }
  }
);

router.get(
  "/presentations/:presentationId/content",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  async (req, res, next) => {
    try {
      const data = await getPresentationContentService(req.params.presentationId);
      res.json({ message: "Presentation content", data });
    } catch (e) { next(e); }
  }
);

router.post(
  "/books/:bookId/progress",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  validateRequest(updateBookProgressSchema),
  updateBookProgressController
);

router.get(
  "/books/:bookId/progress/me",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.READ_LIBRARY_ITEM),
  getMyBookProgressController
);

// ========== Favorites ==========
router.post(
  "/items/:itemType/:itemId/favorite",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_LIBRARY),
  validateRequest(favoriteToggleSchema),
  addFavoriteController
);

router.delete(
  "/items/:itemType/:itemId/favorite",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_LIBRARY),
  removeFavoriteController
);

router.get(
  "/favorites/me",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_LIBRARY),
  listMyFavoritesController
);

// ========== Reviews ==========
router.post(
  "/items/:itemType/:itemId/reviews",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.WRITE_LIBRARY_REVIEW),
  validateRequest(libraryReviewSchema),
  createOrUpdateLibraryReviewController
);

router.get(
  "/items/:itemType/:itemId/reviews",
  listLibraryReviewsController
);

router.get(
  "/items/:itemType/:itemId/reviews/me",
  isAuthenticatedOrSignedContext,
  hasPermission(Permissions.VIEW_LIBRARY),
  getMyLibraryReviewController
);

// ========== Processing Webhook (optional) ==========
router.post(
  "/webhooks/library-file-processed",
  requireInternalSecret,
  validateRequest(libraryProcessingWebhookSchema),
  libraryProcessingWebhookController
);

export default router;
