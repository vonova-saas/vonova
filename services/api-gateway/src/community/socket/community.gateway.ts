import { Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { firstValueFrom } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { AuthGatewayService } from '../../app/auth/auth.service';
import {
  SOCKET_EVENTS,
  SocketAuthUser,
  conversationRoom,
  groupRoom,
  postRoom,
  userRoom,
} from './socket-user.types';

interface HandshakeUserPayload {
  _id?: string;
  email?: string;
  role?: string;
  name?: string;
}

const SOCKET_USER = Symbol.for('vonova.community.socket.user');

interface SocketWithUser extends Socket {
  [SOCKET_USER]?: SocketAuthUser;
}

@WebSocketGateway({
  namespace: '/community',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class CommunitySocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger('CommunitySocket');

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly authService: AuthGatewayService,
    @Inject('NATS_SERVICE') private readonly nats: ClientProxy,
  ) {}

  afterInit(): void {
    this.logger.log('CommunitySocketGateway initialized at namespace /community');
  }

  /**
   * Extract bearer token from socket handshake (`auth.token` preferred, then
   * `Authorization` header, then `cookie` access_token) and resolve to a
   * lightweight user payload via the existing AuthGatewayService.
   */
  private async resolveUser(socket: Socket): Promise<SocketAuthUser | null> {
    const auth = socket.handshake.auth as { token?: unknown } | undefined;
    let token: string | undefined;
    if (typeof auth?.token === 'string' && auth.token.length > 0) {
      token = auth.token;
    } else {
      const header = socket.handshake.headers['authorization'];
      if (typeof header === 'string' && header.startsWith('Bearer ')) {
        token = header.slice(7);
      }
    }
    if (!token) {
      const cookieHeader = socket.handshake.headers['cookie'];
      if (typeof cookieHeader === 'string') {
        const match = /(?:^|;\s*)access_token=([^;]+)/i.exec(cookieHeader);
        if (match) token = decodeURIComponent(match[1]);
      }
    }
    if (!token) return null;

    try {
      const response = await firstValueFrom(this.authService.currentUser(token));
      const userPayload = (response as { user?: HandshakeUserPayload } | undefined)?.user;
      if (!userPayload?._id) return null;
      return {
        _id: String(userPayload._id),
        email: userPayload.email,
        role: userPayload.role,
        name: userPayload.name,
      };
    } catch {
      return null;
    }
  }

  async handleConnection(socket: SocketWithUser): Promise<void> {
    const user = await this.resolveUser(socket);
    if (!user) {
      this.logger.warn(`[SOCKET CONNECT] rejected ${socket.id} — unauthenticated`);
      // `connect_error` is a reserved socket.io event name and emitting it
      // synchronously raises an unhandled error that crashes the host
      // process. Surface the rejection on a custom event and close.
      socket.emit('auth_error', { message: 'Unauthorized' });
      socket.disconnect(true);
      return;
    }
    socket[SOCKET_USER] = user;
    await socket.join(userRoom(user._id));
    this.logger.log(
      `[SOCKET CONNECT] ${socket.id} user=${user._id} role=${user.role ?? 'unknown'}`,
    );
    socket.emit(SOCKET_EVENTS.SYSTEM_ONLINE, { userId: user._id });
  }

  handleDisconnect(socket: SocketWithUser): void {
    const user = socket[SOCKET_USER];
    this.logger.log(
      `[SOCKET DISCONNECT] ${socket.id} user=${user?._id ?? 'unknown'}`,
    );
  }

  @SubscribeMessage('conversation:join')
  async onJoinConversation(
    @ConnectedSocket() socket: SocketWithUser,
    @MessageBody() data: { conversationId?: string } | string,
  ): Promise<{ joined: boolean }> {
    const id =
      typeof data === 'string' ? data : (data?.conversationId ?? '').trim();
    if (!id || !socket[SOCKET_USER]) return { joined: false };
    await socket.join(conversationRoom(id));
    return { joined: true };
  }

  @SubscribeMessage('conversation:leave')
  async onLeaveConversation(
    @ConnectedSocket() socket: SocketWithUser,
    @MessageBody() data: { conversationId?: string } | string,
  ): Promise<{ left: boolean }> {
    const id =
      typeof data === 'string' ? data : (data?.conversationId ?? '').trim();
    if (!id) return { left: false };
    await socket.leave(conversationRoom(id));
    return { left: true };
  }

  @SubscribeMessage('group:join')
  async onJoinGroup(
    @ConnectedSocket() socket: SocketWithUser,
    @MessageBody() data: { groupId?: string } | string,
  ): Promise<{ joined: boolean }> {
    const id = typeof data === 'string' ? data : (data?.groupId ?? '').trim();
    if (!id || !socket[SOCKET_USER]) return { joined: false };
    const user = socket[SOCKET_USER]!;
    try {
      const raw = await firstValueFrom(
        this.nats.send(
          { cmd: 'app.community.group.get' },
          { groupId: id, viewerId: user._id },
        ),
      );
      const envelope = raw as { data?: { role?: string | null } };
      const role = envelope?.data?.role ?? null;
      if (role == null) {
        this.logger.warn(
          `[SOCKET group:join] denied user=${user._id} group=${id} (no membership / no access)`,
        );
        return { joined: false };
      }
    } catch (e) {
      this.logger.warn(
        `[SOCKET group:join] denied user=${user._id} group=${id}: ${(e as Error).message}`,
      );
      return { joined: false };
    }
    await socket.join(groupRoom(id));
    return { joined: true };
  }

  @SubscribeMessage('post:subscribe')
  async onSubscribePost(
    @ConnectedSocket() socket: SocketWithUser,
    @MessageBody() data: { postId?: string } | string,
  ): Promise<{ subscribed: boolean }> {
    const id = typeof data === 'string' ? data : (data?.postId ?? '').trim();
    if (!id || !socket[SOCKET_USER]) return { subscribed: false };
    await socket.join(postRoom(id));
    return { subscribed: true };
  }

  @SubscribeMessage(SOCKET_EVENTS.MESSAGE_TYPING)
  onTyping(
    @ConnectedSocket() socket: SocketWithUser,
    @MessageBody()
    data: { conversationId: string; isTyping: boolean },
  ): void {
    const user = socket[SOCKET_USER];
    if (!user || !data?.conversationId) return;
    socket.to(conversationRoom(data.conversationId)).emit(
      SOCKET_EVENTS.MESSAGE_TYPING,
      {
        conversationId: data.conversationId,
        userId: user._id,
        name: user.name,
        isTyping: !!data.isTyping,
      },
    );
  }

  @SubscribeMessage(SOCKET_EVENTS.GROUP_TYPING)
  onGroupTyping(
    @ConnectedSocket() socket: SocketWithUser,
    @MessageBody() data: { groupId: string; isTyping: boolean },
  ): void {
    const user = socket[SOCKET_USER];
    if (!user || !data?.groupId) return;
    socket.to(groupRoom(data.groupId)).emit(SOCKET_EVENTS.GROUP_TYPING, {
      groupId: data.groupId,
      userId: user._id,
      name: user.name,
      isTyping: !!data.isTyping,
    });
  }

  // ─── Public emit helpers (used by REST controllers/services) ────────────

  emitToUser<T>(userId: string, event: string, payload: T): void {
    if (!userId) return;
    this.server.to(userRoom(userId)).emit(event, payload);
  }

  emitToUsers<T>(userIds: ReadonlyArray<string>, event: string, payload: T): void {
    const rooms = userIds.filter(Boolean).map(userRoom);
    if (!rooms.length) return;
    this.server.to(rooms).emit(event, payload);
  }

  emitToConversation<T>(
    conversationId: string,
    event: string,
    payload: T,
  ): void {
    if (!conversationId) return;
    this.server
      .to(conversationRoom(conversationId))
      .emit(event, payload);
  }

  emitToGroup<T>(groupId: string, event: string, payload: T): void {
    if (!groupId) return;
    this.server.to(groupRoom(groupId)).emit(event, payload);
  }

  emitToPost<T>(postId: string, event: string, payload: T): void {
    if (!postId) return;
    this.server.to(postRoom(postId)).emit(event, payload);
  }

  /** Broadcast to everyone connected to the /community namespace. */
  broadcast<T>(event: string, payload: T): void {
    this.server.emit(event, payload);
  }
}
