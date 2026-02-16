import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, NatsConnection, StringCodec } from 'nats';
import { Env } from '../../config/env.config';

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NatsService.name);
  private nc: NatsConnection | null = null;
  private readonly sc = StringCodec();

  async onModuleInit() {
    try {
      await this.connect();
    } catch (err: unknown) {
      this.logger.error(
        'Failed to establish initial NATS connection. Service will continue without NATS; calls will fail until NATS is available.',
        err as Error,
      );
    }
  }

  async onModuleDestroy() {
    if (this.nc) {
      this.logger.log('Closing NATS connection');
      await this.nc.drain().catch((err: unknown) => {
        this.logger.error('Error while draining NATS connection', err as Error);
      });
    }
  }

  private async connect() {
    if (this.nc) return;

    const { NATS_URL, NATS_USER, NATS_PASSWORD } = Env;

    this.logger.log(`Connecting to NATS at ${NATS_URL}`);

    try {
      this.nc = await connect({
        servers: NATS_URL,
        ...(NATS_USER && NATS_PASSWORD
          ? {
            user: NATS_USER,
            pass: NATS_PASSWORD,
          }
          : {}),
        maxReconnectAttempts: -1,
      });

      this.logger.log('Connected to NATS');
    } catch (err: unknown) {
      this.logger.error('NATS connection failed', err as Error);
      this.nc = null;
      throw err;
    }
  }

  private buildSubject(subject: string): string {
    const prefix = Env.NATS_PREFIX || 'vonova';
    return prefix ? `${prefix}.${subject}` : subject;
  }

  /**
   * Fire-and-forget publish (event style)
   */
  async publish(subject: string, payload: unknown): Promise<void> {
    if (!this.nc) {
      try {
        await this.connect();
      } catch {
        this.logger.error(
          `Skipping NATS publish to subject "${subject}" because connection is not available`,
        );
        return;
      }
    }

    const fullSubject = this.buildSubject(subject);
    const data = this.sc.encode(JSON.stringify(payload ?? {}));

    this.nc!.publish(fullSubject, data);
    this.logger.debug(`Published NATS event to ${fullSubject}`);
  }

  /**
   * Request/Reply pattern (command/action style)
   */
  async request<TResponse = unknown>(
    subject: string,
    payload: unknown,
    timeoutMs = 5000,
  ): Promise<TResponse> {
    if (!this.nc) {
      try {
        await this.connect();
      } catch {
        throw new Error('NATS connection is not available');
      }
    }

    const fullSubject = this.buildSubject(subject);
    const data = this.sc.encode(JSON.stringify(payload ?? {}));

    const msg = await this.nc!.request(fullSubject, data, { timeout: timeoutMs });
    const raw = this.sc.decode(msg.data);

    try {
      return JSON.parse(raw) as TResponse;
    } catch {
      // If downstream didn't send JSON, just return the raw string
      return raw as unknown as TResponse;
    }
  }
}


