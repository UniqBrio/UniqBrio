import IORedis, { Redis, RedisOptions } from 'ioredis';

let redis: Redis | null = null;

const getRedisClient = (): Redis => {
  if (!redis) {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      enableReadyCheck: false,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      // Connection pooling
      family: 4,
      keepAlive: 30000,
      // Performance optimizations
      enableAutoPipelining: true,
    };
    
    redis = new IORedis(options);

    redis.on('error', (err: Error) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  return redis as Redis;
};

// Cache utilities
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    try {
      const client = getRedisClient();
      await client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      return false;
    }
  },

  // Specialized cache methods
  async getCourses(filters: any): Promise<any> {
    const cacheKey = `courses:${JSON.stringify(filters)}`;
    return this.get(cacheKey);
  },

  async setCourses(filters: any, data: any, ttl: number = 600): Promise<boolean> {
    const cacheKey = `courses:${JSON.stringify(filters)}`;
    return this.set(cacheKey, data, ttl);
  },

  async invalidateCourses(): Promise<boolean> {
    return this.invalidatePattern('courses:*');
  }
};

export default getRedisClient;
