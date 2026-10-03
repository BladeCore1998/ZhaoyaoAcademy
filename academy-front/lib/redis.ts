import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connecting: Promise<RedisClient> | null = null;

async function getRedisClient() {
  if (client?.isReady) return client;
  if (!connecting) {
    client = createClient({
      url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
    });
    client.on("error", (error) => {
      console.error("Redis connection error", error);
    });
    connecting = client.connect().then(() => client as RedisClient);
  }
  return connecting;
}

export const redisSecondaryStorage = {
  async get(key: string) {
    return (await getRedisClient()).get(key);
  },
  async getAndDelete(key: string) {
    return (await getRedisClient()).getDel(key);
  },
  async increment(key: string, ttl: number) {
    const redis = await getRedisClient();
    const result = await redis.multi().incr(key).expire(key, ttl, "NX").exec();
    return Number(result?.[0] ?? 0);
  },
  async set(key: string, value: string, ttl?: number) {
    const redis = await getRedisClient();
    if (ttl) {
      await redis.set(key, value, { EX: ttl });
    } else {
      await redis.set(key, value);
    }
  },
  async delete(key: string) {
    await (await getRedisClient()).del(key);
  },
};

