import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import configuration from '../common/config/configuration';

type RedisLike = {
  connect: () => Promise<void>;
  get: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    options?: { EX?: number },
  ) => Promise<unknown>;
};

@Injectable()
export class TokenBlacklistService implements OnModuleInit {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly blacklist = new Map<string, number>();
  private redisClient: RedisLike | null = null;
  private readonly redisPrefix = configuration().REDIS_PREFIX;

  async onModuleInit() {
    await this.initRedisClient();
  }

  private async initRedisClient() {
    try {
      const redisUrl = configuration().REDIS_URL?.trim();
      if (!redisUrl) return;

      // Optional dependency load so service still runs without Redis package.
      const req = eval('require') as (name: string) => any;
      const redisPkg = req('redis') as {
        createClient: (opts: { url: string }) => RedisLike;
      };
      const client = redisPkg.createClient({ url: redisUrl });
      await client.connect();
      this.redisClient = client;
      this.logger.log('Redis blacklist backend connected');
    } catch (error) {
      this.logger.warn('Redis unavailable, using in-memory blacklist fallback');
    }
  }

  private keyFor(token: string): string {
    return `${this.redisPrefix}:${token}`;
  }

  async add(token: string, expiresAtEpochSeconds: number) {
    const now = Math.floor(Date.now() / 1000);
    const ttlSeconds = Math.max(1, expiresAtEpochSeconds - now);
    this.blacklist.set(token, expiresAtEpochSeconds);
    if (!this.redisClient) return;
    try {
      await this.redisClient.set(this.keyFor(token), '1', { EX: ttlSeconds });
    } catch {
      this.redisClient = null;
      this.logger.warn('Redis write failed, switched to in-memory fallback');
    }
  }

  async has(token: string): Promise<boolean> {
    if (this.redisClient) {
      try {
        const value = await this.redisClient.get(this.keyFor(token));
        if (value) return true;
      } catch {
        this.redisClient = null;
        this.logger.warn('Redis read failed, switched to in-memory fallback');
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = this.blacklist.get(token);
    if (!expiresAt) return false;
    if (expiresAt <= now) {
      this.blacklist.delete(token);
      return false;
    }
    return true;
  }
}
