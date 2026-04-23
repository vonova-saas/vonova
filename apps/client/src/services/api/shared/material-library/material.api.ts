import API from "@/services/axios-client";
import type { 
  CreateMaterialRequest, 
  CreateMaterialResponse,
  DeleteMaterialResponse 
} from "@/types/api/shared/material-library/material.type";

// Unified LMS Library API Functions

/**
 * Fetch library items from Unified LMS API
 * @param type - Optional filter by type (e.g., 'book', 'video', etc.)
 * @returns Promise with library items response
 */
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

/**
 * Create a new library book in Unified LMS API
 * @param data - Book creation data
 * @returns Promise with creation response
 */
export const createLibraryBookMutationFn = async (
  data: CreateMaterialRequest
): Promise<CreateMaterialResponse> => {
  // Map frontend fields to backend expected format
  const { type, isPublished, ...rest } = data; // Remove type and isPublished as backend doesn't accept them
  
  // Ensure slug exists, generate from title if missing
  const slug = rest.title.toLowerCase()
    .replace(/ /g, '-')           // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '')      // Remove special characters except letters, numbers, hyphens, underscores
    .replace(/--+/g, '-')         // Replace multiple hyphens with single hyphen
    .trim();                      // Remove leading/trailing spaces
  
  const finalPayload = {
    title: rest.title,
    description: rest.description,
    topics: rest.topicId ? [rest.topicId] : [], // Send as array
    fileUrl: rest.fileUrl,
    slug: slug,
    status: 'PUBLISHED' // Set default status to PUBLISHED for student visibility
  };

  // Use different endpoints based on content type
  let endpoint = "/lms/library/books/createBook";
  if (data.type === 'presentation') {
    endpoint = "/lms/library/presentation/create";
  } else if (data.type === 'visual-guide') {
    endpoint = "/lms/library/guides/create";
  }

  const response = await API.post(endpoint, finalPayload);
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
  let endpoint = `/lms/library/items/${type.toUpperCase()}/${id}/file/complete`;
  
  // Include payload with assetId and objectKey if provided
  const payload = assetId && objectKey ? {
    assetId: assetId,
    objectKey: objectKey
  } : {};
  
  const response = await API.post(endpoint, payload);
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
