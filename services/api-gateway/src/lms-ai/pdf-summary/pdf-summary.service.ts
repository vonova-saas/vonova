import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PdfSummaryGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) { }

  uploadPDF(data: any) {
    return this.client.send({ cmd: 'lms.ai.pdf.upload' }, data);
  }

  chatWithPDF(data: {
    session_id: string;
    question: string;
    user_id?: string;
    context_length?: number;
    ip?: string;
    userAgent?: string;
  }) {
    return this.client.send({ cmd: 'lms.ai.pdf.chat' }, data);
  }

  getFullSummary(data: {
    session_id: string;
    user_id?: string;
    ip?: string;
    userAgent?: string;
  }) {
    return this.client.send({ cmd: 'lms.ai.pdf.summarize' }, data);
  }

  getSessionChatHistory(data: {
    sessionId: string;
    page?: string;
    limit?: string;
  }) {
    return this.client.send({ cmd: 'lms.ai.pdf.getChatHistory' }, data);
  }

  rateChatResponse(data: { chatId: string; rating: number; user_id?: string }) {
    return this.client.send({ cmd: 'lms.ai.pdf.rateChat' }, data);
  }

  deleteSession(data: { sessionId: string; userId?: string }) {
    return this.client.send({ cmd: 'lms.ai.pdf.deleteSession' }, data);
  }

  getSessionsByUserId(data: { user_id: string }) {
    return this.client.send({ cmd: 'lms.ai.pdf.getSessionsByUserId' }, data);
  }

  getServiceStats(data: { user_id?: string }) {
    return this.client.send({ cmd: 'lms.ai.pdf.stats' }, data);
  }

  bulkDeleteSessions(data: { session_ids: string[]; user_id?: string }) {
    return this.client.send({ cmd: 'lms.ai.pdf.batchDelete' }, data);
  }

  getQueryAnalytics(data: {
    start_date?: string;
    end_date?: string;
    user_id?: string;
  }) {
    return this.client.send({ cmd: 'lms.ai.pdf.getQueryAnalytics' }, data);
  }

  getHealth() {
    return this.client.send({ cmd: 'lms.ai.pdf.health' }, {});
  }

  testAiConnection() {
    return this.client.send({ cmd: 'lms.ai.pdf.testAiConnection' }, {});
  }

  voiceAsk(data: {
    session_id: string;
    audioBase64: string;
    mimeType?: string;
    filename?: string;
    user_id?: string;
    idempotency_key?: string;
  }) {
    return this.client.send({ cmd: 'lms.ai.pdf.voiceAsk' }, data);
  }
}
