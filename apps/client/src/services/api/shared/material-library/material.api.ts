import API from "@/services/axios-client";
import { peelLmsResponseLayers } from "@/lib/api/unwrap-lms-body";
import type {
  CreateMaterialRequest,
  CreateMaterialResponse,
  DeleteMaterialResponse,
  UploadFileResponse
} from "@/types/api/shared/material-library/material.type";

/**
 * Library routes must include `/api/v1/...`. Paths like `/lms/library/...` are
 * resolved by axios relative to the request origin only, so with
 * `baseURL = https://host/api/v1` they incorrectly become `https://host/lms/...`
 * (the `/api/v1` segment is dropped).
 */
const LMS_LIBRARY_V1 = "/api/v1/lms/library";
const LMS_LIBRARY_BOOKS = `${LMS_LIBRARY_V1}/books`;
const LMS_LIBRARY_PRESENTATION = `${LMS_LIBRARY_V1}/presentation`;
const LMS_LIBRARY_GUIDES = `${LMS_LIBRARY_V1}/guides`;

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

import { S3_PRESIGNED_QUERY_STALE_NEVER } from "@/lib/lms/presigned-url";

/** Presigned library view URLs must be fetched at open time, not cached across sessions. */
export const MATERIAL_SIGNED_VIEW_STALE_MS = S3_PRESIGNED_QUERY_STALE_NEVER;

export const fetchMaterialSignedViewUrl = async (
  materialId: string,
  materialType?: "book" | "guide" | "presentation"
): Promise<{ success: boolean; data: { url: string } }> => {
  const q =
    materialType != null
      ? `?type=${encodeURIComponent(materialType)}`
      : "";
  const response = await API.get(
    `${LMS_LIBRARY_V1}/materials/${encodeURIComponent(materialId)}/view${q}`,
  );
  const peeled = peelLmsResponseLayers(response.data) as Record<string, unknown>;
  const inner = (peeled?.data ?? peeled) as Record<string, unknown>;
  const url = String(
    inner?.url ??
      inner?.presignedUrl ??
      peeled?.url ??
      peeled?.presignedUrl ??
      "",
  ).trim();
  if (!url) {
    return { success: false, data: { url: "" } };
  }
  return { success: true, data: { url } };
};

/** Default page size for catalog UIs (student + instructor). LMS used to cap at 10. */
export const LIBRARY_CATALOG_DEFAULT_LIMIT = 500;

/** Read `total` from GET /lms/library responses (shape varies slightly). */
export function extractLibraryCatalogTotal(
  response: unknown,
): number | undefined {
  const r = response as Record<string, unknown> | undefined;
  if (!r) return undefined;
  const top = r.total;
  if (typeof top === "number" && Number.isFinite(top) && top >= 0) {
    return top;
  }
  const d = r.data;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    const nested = (d as Record<string, unknown>).total;
    if (
      typeof nested === "number" &&
      Number.isFinite(nested) &&
      nested >= 0
    ) {
      return nested;
    }
  }
  return undefined;
}

export const fetchLibraryItemsQueryFn = async (
  type?: string,
  status?: string,
  options?: { limit?: number; page?: number },
): Promise<any> => {
  const params = new URLSearchParams();
  if (type) {
    params.append('type', type);
  }
  if (status) {
    params.append('status', status);
  }
  const limit = options?.limit ?? LIBRARY_CATALOG_DEFAULT_LIMIT;
  const page = options?.page ?? 1;
  params.append('limit', String(limit));
  params.append('page', String(page));

  const response = await API.get(`${LMS_LIBRARY_V1}?${params.toString()}`);
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
  let endpoint = `${LMS_LIBRARY_BOOKS}/createBook`;
  if (data.type === 'presentation') {
    endpoint = `${LMS_LIBRARY_PRESENTATION}/createPresentation`;
  } else if (data.type === 'visual-guide') {
    endpoint = LMS_LIBRARY_GUIDES;
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
  const peeled = peelLmsResponseLayers(response.data) as Record<string, unknown>;
  return {
    message: String(peeled?.message ?? "File uploaded successfully"),
    presignedUrl: String(peeled?.presignedUrl ?? ""),
    fileUrl: String(peeled?.fileUrl ?? ""),
    objectKey: String(peeled?.objectKey ?? "").trim(),
    size: Number(peeled?.size ?? 0),
    assetId: String(peeled?.assetId ?? ""),
    fileName: String(peeled?.fileName ?? file.name),
    mimeType: String(peeled?.mimeType ?? file.type),
    expiresInSeconds: Number(peeled?.expiresInSeconds ?? 3600),
  };
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
  const peeled = peelLmsResponseLayers(response.data);
  return peeled ?? response.data;
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
      ? `${LMS_LIBRARY_PRESENTATION}/updatePresentation/${encodeURIComponent(materialId)}`
      : viewType === "guide"
        ? `${LMS_LIBRARY_GUIDES}/${encodeURIComponent(materialId)}`
        : `${LMS_LIBRARY_BOOKS}/${encodeURIComponent(materialId)}`;

  const response = await API.patch(endpoint, { visibility });
  return response.data;
};

/**
 * Map a form `topicId` (kebab-case slug used by the page) to the API
 * `LibraryTopics` enum value the backend DTOs validate against. Returns
 * `undefined` for unknown values so we drop instead of sending an invalid
 * topic that would 400 the whole PATCH.
 *
 * Keep in sync with `services/api-gateway/src/lms/library/library/dto/topics.dto.ts`.
 */
const LIBRARY_TOPIC_SLUG_TO_LABEL: Record<string, string> = {
  "programming-basics": "Programming Basics",
  "web-development": "Web Development",
  frontend: "FRONTEND",
  backend: "BACKEND",
  fullstack: "FULLSTACK",
  flutter: "FLUTTER",
  "mobile-development": "Mobile Development",
  ai: "AI",
  "machine-learning": "Machine Learning",
  "data-science": "Data Science",
  "cyber-security": "CYBER SECURITY",
  devops: "DEVOPS",
  "ui-ux": "UI UX",
  "database-design": "Database Design",
  "problem-solving": "Problem Solving",
  "data-structure": "Data Structure",
  "data-structures": "Data Structure",
  algorithms: "Algorithms",
  "cloud-computing": "Cloud Computing",
  other: "OTHER",
};

function mapClientTopicToApiTopic(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (trimmed === "") return undefined;
  // Already a canonical label (e.g. "Programming Basics") -> pass through.
  if (Object.values(LIBRARY_TOPIC_SLUG_TO_LABEL).includes(trimmed)) return trimmed;
  return LIBRARY_TOPIC_SLUG_TO_LABEL[trimmed.toLowerCase()];
}

/**
 * Patch fields on a library material (title, description, category, level,
 * isPublished, visibility, …). Routes to the per-type PATCH endpoint based
 * on `viewType`, since the three resources live behind different controllers
 * but share equivalent `Update*Dto`s (`PartialType(Create*Dto)`).
 *
 * IMPORTANT: the api-gateway DTOs use `topics: string[]` (with the
 * `LibraryTopics` enum) and `status` ('DRAFT' | 'PUBLISHED' | 'ARCHIVED').
 * The form however passes the higher-level `topicId` (kebab slug) and
 * `isPublished` (boolean). This helper does the conversion, mirroring
 * `createLibraryBookMutationFn`, so callers can keep using the form shape
 * and validation `forbidNonWhitelisted: true` will not 400 the request.
 *
 * Only defined fields are sent (so we never overwrite values with `undefined`).
 */
export const updateLibraryMaterialMutationFn = async (params: {
  materialId: string;
  viewType: "book" | "guide" | "presentation";
  patch: {
    title?: string;
    description?: string;
    category?: string;
    level?: "Beginner" | "Intermediate" | "Advanced";
    /** Kebab-slug from the form; mapped to the `LibraryTopics` enum before send. */
    topicId?: string;
    /** Mapped to `status: 'PUBLISHED' | 'DRAFT'`. Guides always go to `PUBLISHED`. */
    isPublished?: boolean;
    visibility?: "PUBLIC" | "PRIVATE";
  };
}): Promise<unknown> => {
  const { materialId, viewType, patch } = params;
  const endpoint =
    viewType === "presentation"
      ? `${LMS_LIBRARY_PRESENTATION}/updatePresentation/${encodeURIComponent(materialId)}`
      : viewType === "guide"
        ? `${LMS_LIBRARY_GUIDES}/${encodeURIComponent(materialId)}`
        : `${LMS_LIBRARY_BOOKS}/${encodeURIComponent(materialId)}`;

  const body: Record<string, unknown> = {};

  if (patch.title !== undefined && patch.title.trim().length > 0) {
    body.title = patch.title.trim();
  }
  if (patch.description !== undefined) {
    body.description = patch.description;
  }
  if (patch.category !== undefined && patch.category.trim().length > 0) {
    body.category = patch.category;
  }
  if (patch.level !== undefined) {
    body.level = patch.level;
  }
  if (patch.visibility !== undefined) {
    body.visibility = patch.visibility;
  }
  if (patch.topicId !== undefined) {
    const apiTopic = mapClientTopicToApiTopic(patch.topicId);
    if (apiTopic) body.topics = [apiTopic];
  }
  if (patch.isPublished !== undefined) {
    const published = patch.isPublished !== false;
    // Guides only support PUBLISHED | ARCHIVED on LMS; keep them published
    // until DRAFT support lands there (matches create behaviour).
    body.status =
      viewType === "guide"
        ? "PUBLISHED"
        : published
          ? "PUBLISHED"
          : "DRAFT";
  }

  if (Object.keys(body).length === 0) return null;

  const response = await API.patch(endpoint, body);
  return response.data;
};

// Delete function with support for multiple content types
export const deleteMaterialMutationFn = async (
  id: string,
  type?: string
): Promise<DeleteMaterialResponse> => {
  // Use different endpoints based on content type
  let endpoint = `${LMS_LIBRARY_BOOKS}/${id}`;
  if (type === 'presentation') {
    endpoint = `${LMS_LIBRARY_PRESENTATION}/${id}`;
  } else if (type === 'visual-guide') {
    endpoint = `${LMS_LIBRARY_GUIDES}/${id}`;
  }

  const response = await API.delete(endpoint);
  return response.data;
};
