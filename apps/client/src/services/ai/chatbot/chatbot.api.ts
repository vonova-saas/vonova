import {
  ChatRequestType,
  ChatResponseType
} from "@/types/api/ai/chatbot/chatbot.type";

export const sendChatMessageMutationFn = async (
  data: ChatRequestType
): Promise<ChatResponseType> => {
  const response = await fetch(
    "/api/chatbot",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
};