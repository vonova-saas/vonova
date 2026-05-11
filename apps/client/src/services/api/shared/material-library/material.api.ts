import API from "@/services/axios-client";
import type {
  CreateMaterialRequest,
  CreateMaterialResponse,
  DeleteMaterialResponse,
  UploadFileResponse
} from "@/types/api/shared/material-library/material.type";

// Unified LMS Library API Functions

/**
 * Fetch library items from Unified LMS API
 * @param type - Optional filter by type (e.g., 'book', 'video', etc.)
 * @returns Promise with library items response
 */
/**
 * Presigned GET URL for opening or downloading a library material file.
 */
export const materialSignedViewQueryKey = (
  materialId: string,
  materialType: "book" | "guide" | "presentation" = "book",
) => ["lms", "material-signed-view", materialId, materialType] as const;

/** Keep below LMS `AWS_S3_LIBRARY_GET_PRESIGN_EXPIRES` (default 3600s) so URLs refresh before S3 expiry. */
export const MATERIAL_SIGNED_VIEW_STALE_MS = 45 * 60 * 1000;

export const fetchMaterialSignedViewUrl = async (
  materialId: string,
  materialType?: "book" | "guide" | "presentation"
): Promise<{ success: boolean; data: { url: string } }> => {
  const q =
    materialType != null
      ? `?type=${encodeURIComponent(materialType)}`
      : "";
  const response = await API.get(
    `/lms/library/materials/${encodeURIComponent(materialId)}/view${q}`
  );
  return response.data;
};

export const fetchLibraryItemsQueryFn = async (
  type?: string,
  status?: string
): Promise<any> => {
  const params = new URLSearchParams();
  if (type) {
    params.append('type', type);
  }
  if (status) {
    params.append('status', status);
  }

  const response = await API.get(`/lms/library?${params.toString()}`);
  return response.data;
};

/** Normalized row for lesson editor attach / materials list (shared React Query cache shape). */
export type InstructorLibraryEditorRow = {
  _id: string;
  title: string;
  viewType: "book" | "guide" | "presentation";
  type?: string;
  visibility?: "PUBLIC" | "PRIVATE";
};

export function normalizeLibraryCatalogResponse(
  res: unknown,
): InstructorLibraryEditorRow[] {
  let items: unknown[] = [];
  const r = res as Record<string, unknown>;
  if (Array.isArray(res)) items = res;
  else if (Array.isArray(r?.data)) items = r.data as unknown[];
  else if (r?.data && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    items = [
      ...(Array.isArray(d.books) ? d.books : []),
      ...(Array.isArray(d.guides) ? d.guides : []),
      ...(Array.isArray(d.presentations) ? d.presentations : []),
      ...(Array.isArray(d.uploads) ? d.uploads : []),
    ];
  } else if (Array.isArray(r?.items)) items = r.items as unknown[];
  else if (Array.isArray(r?.materials)) items = r.materials as unknown[];

  return items.map((item: unknown) => {
    const it = item as Record<string, unknown>;
    const rawType = String(it.type || "book").toUpperCase();
    const viewType: "book" | "guide" | "presentation" =
      rawType === "PRESENTATION" || rawType === "PRESENTATIONS"
        ? "presentation"
        : rawType === "GUIDE" ||
            rawType === "GUIDES" ||
            rawType === "VISUAL-GUIDE"
          ? "guide"
          : "book";
    return {
      _id: String(it._id ?? it.id),
      title: String(it.title ?? "Untitled"),
      viewType,
      type: it.type as string | undefined,
      visibility: it.visibility as "PUBLIC" | "PRIVATE" | undefined,
    };
  });
}

export async function fetchInstructorLessonEditorLibraryQueryFn(): Promise<
  InstructorLibraryEditorRow[]
> {
  const res = await fetchLibraryItemsQueryFn();
  return normalizeLibraryCatalogResponse(res);
}

/** Shared key; includes `catalog-rows` so cache is not confused with the old map-shaped data. */
export const instructorLessonEditorLibraryQueryKey = [
  "instructor-lesson-editor",
  "library",
  "catalog-rows",
] as const;

/**
 * Create a new library book in Unified LMS API
 * @param data - Book creation data
 * @returns Promise with creation response
 */
export const createLibraryBookMutationFn = async (
  data: CreateMaterialRequest
): Promise<CreateMaterialResponse> => {
  const { type, isPublished, ...rest } = data;

  // Ensure slug exists, generate from title if missing
  const slug = rest.title.toLowerCase()
    .replace(/ /g, '-')           // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '')      // Remove special characters except letters, numbers, hyphens, underscores
    .replace(/--+/g, '-')         // Replace multiple hyphens with single hyphen
    .trim();                      // Remove leading/trailing spaces

  const level = rest.level ?? "Beginner";
  const category = rest.category?.trim() || undefined;
  const published = isPublished !== false;
  /** Guides only support PUBLISHED | ARCHIVED on LMS; keep published until DRAFT exists. */
  const status =
    type === "visual-guide"
      ? "PUBLISHED"
      : published
        ? "PUBLISHED"
        : "DRAFT";

  const visibility =
    rest.visibility === "PUBLIC" || rest.visibility === "PRIVATE"
      ? rest.visibility
      : rest.isPublic
        ? "PUBLIC"
        : undefined;

  const finalPayload = {
    title: rest.title,
    description: rest.description,
    authors: rest.authors || (rest.authorName ? [{ name: rest.authorName }] : []),
    topics: rest.topicId ? [rest.topicId] : [], // Send as array
    fileUrl: rest.fileUrl,
    slug: slug,
    status,
    level,
    ...(category ? { category } : {}),
    ...(visibility ? { visibility } : {}),
    ...(rest.courseId ? { courseId: rest.courseId } : {}),
    ...(rest.lessonId ? { lessonId: rest.lessonId } : {}),
  };

  // Use different endpoints based on content type
  let endpoint = "/lms/library/books/createBook";
  if (data.type === 'presentation') {
    endpoint = "/lms/library/presentation/createPresentation";
  } else if (data.type === 'visual-guide') {
    endpoint = "/lms/library/guides";
  }

  const response = await API.post(endpoint, finalPayload);
  const responseData = response.data;

  if (responseData?.material) {
    return responseData;
  }

  return {
    material: responseData,
    message: responseData?.message || "Material created successfully",
  };
};

/**
 * Upload file to library item via API Gateway
 * This uploads to S3 and creates asset record in MongoDB
 * @param itemType - Type of item ('book', 'presentation', 'guide')
 * @param itemId - The item ID returned from create
 * @param file - The file to upload
 * @returns Upload response with assetId, fileUrl, objectKey
 */
export const uploadLibraryFileMutationFn = async (
  itemType: 'book' | 'presentation' | 'guide',
  itemId: string,
  file: File
): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await API.post(
    `/api/v1/lms/library/items/upload?itemType=${itemType}&itemId=${itemId}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};

// Complete upload function to finalize file processing
export const completeUploadMutationFn = async (
  id: string,
  type: string,
  assetId?: string,
  objectKey?: string
): Promise<any> => {
  // Use uppercase type names for the endpoint as required
  let endpoint = `/api/v1/lms/library/items/${type.toUpperCase()}/${id}/file/complete`;

  // Include payload with assetId and objectKey if provided
  const payload = assetId && objectKey ? {
    assetId: assetId,
    objectKey: objectKey
  } : {};

  const response = await API.post(endpoint, payload);
  return response.data;
};

/**
 * Update a single library material's visibility (PUBLIC <-> PRIVATE).
 *
 * Routes to the correct PATCH endpoint based on view-type so we don't have to
 * surface three near-identical hooks at the call site. Returns the updated
 * material payload as-returned by the API gateway (shape varies per type).
 */
export const updateLibraryMaterialVisibilityMutationFn = async (params: {
  materialId: string;
  viewType: "book" | "guide" | "presentation";
  visibility: "PUBLIC" | "PRIVATE";
}): Promise<unknown> => {
  const { materialId, viewType, visibility } = params;
  const endpoint =
    viewType === "presentation"
      ? `/lms/library/presentation/updatePresentation/${encodeURIComponent(materialId)}`
      : viewType === "guide"
        ? `/lms/library/guides/${encodeURIComponent(materialId)}`
        : `/lms/library/books/${encodeURIComponent(materialId)}`;

  const response = await API.patch(endpoint, { visibility });
  return response.data;
};

// Delete function with support for multiple content types
export const deleteMaterialMutationFn = async (
  id: string,
  type?: string
): Promise<DeleteMaterialResponse> => {
  // Use different endpoints based on content type
  let endpoint = `/lms/library/books/${id}`;
  if (type === 'presentation') {
    endpoint = `/lms/library/presentation/${id}`;
  } else if (type === 'visual-guide') {
    endpoint = `/lms/library/guides/${id}`;
  }

  const response = await API.delete(endpoint);
  return response.data;
};
