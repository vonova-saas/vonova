import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { PdfSummaryService } from './pdf-summary.service';
import { SignedContextGuard } from '../common/guards/signed-context.guard';

/**
 * WebSocket Gateway for real-time PDF chat streaming
 * 
 * This gateway enables real-time communication for PDF chat functionality.
 * Clients can connect to the /pdf-summary namespace and send chat requests.
 */
@WebSocketGateway({
  namespace: '/pdf-summary',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
})
export class PdfSummaryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PdfSummaryGateway.name);
  private readonly connectedClients = new Map<string, Socket>();

  constructor(private readonly pdfSummaryService: PdfSummaryService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    client.emit('connected', {
      message: 'Connected to PDF Summary WebSocket',
      clientId: client.id,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody() data: { session_id: string; question: string; user_id?: string; context_length?: number },
    @ConnectedSocket() client: Socket
  ) {
    try {
      this.logger.log(`Received chat request from client ${client.id}: ${data.question}`);

      // Emit initial acknowledgment
      client.emit('chat:started', {
        session_id: data.session_id,
        question: data.question,
        timestamp: new Date().toISOString()
      });

      // Process chat request
      const response = await this.pdfSummaryService.chatWithPDF(
        {
          session_id: data.session_id,
          question: data.question,
          user_id: data.user_id,
          context_length: data.context_length
        }
      );

      // Emit complete response
      client.emit('chat:response', {
        status: true,
        answer: response.answer,
        session_id: response.session_id,
        filename: response.filename,
        ai_wizard_status: response.ai_wizard_status,
        magic_level: response.magic_level,
        metadata: response.metadata,
        timestamp: new Date().toISOString()
      });

      // For streaming support (if implemented in future)
      // You could emit partial responses as they're generated
      // client.emit('chat:stream', { chunk: 'partial response...' });

    } catch (error) {
      this.logger.error(`Error handling chat request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      client.emit('chat:error', {
        status: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      serverTime: Date.now()
    });
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Send a message to a specific client
   */
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }
}

