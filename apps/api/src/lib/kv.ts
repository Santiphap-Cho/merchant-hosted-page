import { Redis } from "@upstash/redis";

export interface KV {
  getJSON<T>(key: string): Promise<T | null>;
  setJSON(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
}

class RedisKV implements KV {
  constructor(private readonly redis: Redis) {}

  async getJSON<T>(key: string): Promise<T | null> {
    return (await this.redis.get<T>(key)) ?? null;
  }

  async setJSON(key: string, value: unknown): Promise<void> {
    await this.redis.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async sadd(key: string, member: string): Promise<void> {
    await this.redis.sadd(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return this.redis.smembers(key);
  }
}

/**
 * In-memory fallback used for local development when no Redis credentials are
 * present. NOT suitable for serverless/production (data is per-process).
 */
class MemoryKV implements KV {
  private readonly store = new Map<string, unknown>();
  private readonly sets = new Map<string, Set<string>>();

  async getJSON<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null;
  }

  async setJSON(key: string, value: unknown): Promise<void> {
    this.store.set(key, structuredClone(value));
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async sadd(key: string, member: string): Promise<void> {
    const set = this.sets.get(key) ?? new Set<string>();
    set.add(member);
    this.sets.set(key, set);
  }

  async smembers(key: string): Promise<string[]> {
    return [...(this.sets.get(key) ?? [])];
  }
}

function createKV(): KV {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new RedisKV(new Redis({ url, token }));
  }

  if (process.env.VERCEL === "1") {
    console.warn(
      "[kv] No Redis credentials found. Carts/orders will NOT persist across " +
        "serverless instances. Set KV_REST_API_URL and KV_REST_API_TOKEN.",
    );
  }

  return new MemoryKV();
}

export const kv: KV = createKV();
