export type ChatRequestType = {
  message: string;
  lang?: string;
};

export type ChatResponseType = {
  bot: string;
  intent: string;
  confidence: number;
  reply: string;
  image?: string;
  lang: string;
};