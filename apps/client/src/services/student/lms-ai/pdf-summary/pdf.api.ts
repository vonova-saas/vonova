import API from "@/services/axios-client";
import { unwrapLmsDataDeep } from "@/lib/api/unwrap-lms-body";
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
function normalizePdfChatPayload(body: unknown): ChatResponse {
  const raw = unwrapLmsDataDeep(body) as Record<string, unknown> | null;
  const o = raw && typeof raw === "object" ? raw : {};
  const nested =
    o.data && typeof o.data === "object"
      ? (o.data as Record<string, unknown>)
      : undefined;
  const answer =
    (typeof o.answer === "string" && o.answer) ||
    (typeof o.response === "string" && o.response) ||
    (nested && typeof nested.answer === "string" && nested.answer) ||
    "";
  const session_id =
    (typeof o.session_id === "string" && o.session_id) ||
    (typeof o.sessionId === "string" && o.sessionId) ||
    (nested && typeof nested.session_id === "string" && nested.session_id) ||
    "";
  const message_id =
    (typeof o.message_id === "string" && o.message_id) ||
    (nested && typeof nested.message_id === "string" && nested.message_id) ||
    undefined;
  return { answer, session_id, message_id };
}

export const chatWithPDFMutationFn = async (
  data: ChatRequest
): Promise<ChatResponse> => {
  const response = await API.post(`/pdf-summary/chat?session_id=${data.session_id}`, {
    question: data.question,
    ...(data.context_length && { context_length: data.context_length })
  });
  const normalized = normalizePdfChatPayload(response.data);
  if (!normalized.answer?.trim()) {
    const preview =
      typeof response.data === "object" && response.data !== null
        ? JSON.stringify(response.data).slice(0, 400)
        : String(response.data);
    throw new Error(
      `PDF chat returned no answer. Raw payload (truncated): ${preview}`,
    );
  }
  return normalized;
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