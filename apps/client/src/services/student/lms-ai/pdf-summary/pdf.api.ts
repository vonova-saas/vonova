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

  const response = await API.post("/pdf-summary/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return response.data;
};

// ============== Chat with PDF ==============
export const chatWithPDFMutationFn = async (
  data: ChatRequest
): Promise<ChatResponse> => {
  const response = await API.post(`/pdf-summary/chat?session_id=${data.session_id}`, {
    question: data.question,
    ...(data.context_length && { context_length: data.context_length })
  });
  return response.data;
};

// ============== Get Summary ==============
export const getPDFSummaryQueryFn = async (
  data: GetSummaryRequest
): Promise<GetSummaryResponse> => {
  const response = await API.get("/pdf-summary/summarize", {
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
  const response = await API.get(`/pdf-summary/session/${sessionId}/chat-history`);
  return response.data;
};

// ============== Delete Session ==============
export const deleteSessionMutationFn = async (
  sessionId: string
): Promise<DeleteSessionResponse> => {
  const response = await API.delete(`/pdf-summary/session/${sessionId}`);
  return response.data;
};

export const getSessionsQueryFn = async (): Promise<GetSessionsResponse> => {
  const response = await API.get("/pdf-summary/sessions");
  return response.data;
};

// ============== Get Full Session ==============
export const getSessionFullQueryFn = async (
  sessionId: string
): Promise<any> => {
  const response = await API.get(`/pdf-summary/session/${sessionId}/full`);
  return response.data;
};