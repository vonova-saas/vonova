import API from "@/services/axios-client";
import {
  UploadPDFRequest,
  UploadPDFResponse,
  ChatRequest,
  ChatResponse,
  GetSummaryRequest,
  GetSummaryResponse,
  ChatHistoryResponse,
  DeleteSessionResponse,
  GetSessionsResponse,
} from "@/types/api/student/lms-ai/pdf-summary/pdf.type";

// ============== Upload PDF ==============
export const uploadPDFMutationFn = async (
  data: UploadPDFRequest
): Promise<UploadPDFResponse> => {
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("user_id", data.user_id);
  if (data.language)
    formData.append("language", data.language);

  const response = await API.post("/api/v1/pdf-summary/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ============== Chat with PDF ==============
export const chatWithPDFMutationFn = async (
  data: ChatRequest
): Promise<ChatResponse> => {
  const response = await API.post("/api/v1/pdf-summary/chat", data);
  return response.data;
};

// ============== Get Summary ==============
export const getPDFSummaryQueryFn = async (
  data: GetSummaryRequest
): Promise<GetSummaryResponse> => {
  const response = await API.get("/api/v1/pdf-summary/summarize", {
    params: {
      session_id: data.session_id,
      user_id: data.user_id,
    },
  });
  return response.data;
};

// ============== Get Chat History ==============
export const getChatHistoryQueryFn = async (
  sessionId: string
): Promise<ChatHistoryResponse> => {
  const response = await API.get(`/api/v1/pdf-summary/session/${sessionId}/chat-history`);
  return response.data;
};

// ============== Delete Session ==============
export const deleteSessionMutationFn = async (
  sessionId: string
): Promise<DeleteSessionResponse> => {
  const response = await API.delete(`/api/v1/pdf-summary/session/${sessionId}`);
  return response.data;
};

export const getSessionsQueryFn = async (): Promise<GetSessionsResponse> => {
  const response = await API.get("/api/v1/pdf-summary/sessions");
  return response.data;
};