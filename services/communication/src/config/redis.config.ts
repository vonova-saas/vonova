import { Redis } from "@upstash/redis";
import { Env } from "./env.config";

const redisClient = new Redis({
  url: Env.UPSTASH_REDIS_REST_URL,
  token: Env.UPSTASH_REDIS_REST_TOKEN,
});

const getRedisTokenKey = (userId: string, deviceHash: string) =>
  `refresh:${userId}:${deviceHash}`;

export { redisClient, getRedisTokenKey };