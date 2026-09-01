/**
 * Redis Client for OjaBridge
 * 
 * Provides persistent rate limiting, session caching, and pub/sub.
 * Falls back to in-memory Map if Redis is not configured.
 * 
 * Environment variables:
 *   REDIS_URL — Redis connection string (e.g. redis://default:password@host:port)
 *   REDIS_ENABLED — Set to 'false' to disable Redis and use in-memory fallback
 */

import Redis from 'ioredis';

let redisClient = null;
let redisAvailable = false;
const memoryStore = new Map();

function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  const redisEnabled = process.env.REDIS_ENABLED !== 'false';

  if (!redisUrl || !redisEnabled) {
    console.log('[Redis] No REDIS_URL configured — using in-memory fallback');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      connectTimeout: 5000,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      console.log('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
      redisAvailable = false;
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('close', () => {
      redisAvailable = false;
    });

    redisClient.connect().catch(() => {
      console.log('[Redis] Failed to connect — falling back to in-memory');
      redisAvailable = false;
    });

    return redisClient;
  } catch (err) {
    console.error('[Redis] Initialization error:', err.message);
    return null;
  }
}

/**
 * Get a value from Redis or memory
 */
export async function cacheGet(key) {
  const client = getRedisClient();
  if (client && redisAvailable) {
    try {
      const val = await client.get(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  }
  // In-memory fallback
  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiry && Date.now() > item.expiry) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

/**
 * Set a value in Redis or memory with optional TTL (seconds)
 */
export async function cacheSet(key, value, ttlSeconds = 300) {
  const client = getRedisClient();
  if (client && redisAvailable) {
    try {
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return true;
    } catch { return false; }
  }
  // In-memory fallback
  memoryStore.set(key, {
    value,
    expiry: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null,
  });
  return true;
}

/**
 * Delete a key from Redis or memory
 */
export async function cacheDel(key) {
  const client = getRedisClient();
  if (client && redisAvailable) {
    try { await client.del(key); } catch {}
  }
  memoryStore.delete(key);
}

/**
 * Rate limiting — check if a key exceeds the limit within a window
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export async function rateLimit(key, maxRequests, windowSeconds) {
  const client = getRedisClient();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (client && redisAvailable) {
    try {
      // Use Redis pipeline for atomicity
      const multi = client.multi();
      const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
      multi.incr(windowKey);
      multi.expire(windowKey, windowSeconds);
      const results = await multi.exec();
      const count = results?.[0]?.[1] || 1;
      return {
        allowed: count <= maxRequests,
        remaining: Math.max(0, maxRequests - count),
        resetAt: Math.ceil((Math.floor(now / windowMs) + 1) * windowMs),
      };
    } catch {
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  const memKey = `rl:${key}`;
  if (!memoryStore.has(memKey)) memoryStore.set(memKey, []);
  const requests = memoryStore.get(memKey).filter(t => t > now - windowMs);
  requests.push(now);
  memoryStore.set(memKey, requests);
  return {
    allowed: requests.length <= maxRequests,
    remaining: Math.max(0, maxRequests - requests.length),
    resetAt: Math.ceil((now + windowMs) / windowMs) * windowMs,
  };
}

/**
 * Increment a counter (e.g., login attempts)
 */
export async function incrCounter(key, ttlSeconds = 900) {
  const client = getRedisClient();
  if (client && redisAvailable) {
    try {
      const val = await client.incr(key);
      if (val === 1) await client.expire(key, ttlSeconds);
      return val;
    } catch { return 1; }
  }
  // In-memory fallback
  const item = memoryStore.get(key);
  if (!item || (item.expiry && Date.now() > item.expiry)) {
    memoryStore.set(key, { value: 1, expiry: Date.now() + (ttlSeconds * 1000) });
    return 1;
  }
  item.value++;
  return item.value;
}

/**
 * Get counter value
 */
export async function getCounter(key) {
  const client = getRedisClient();
  if (client && redisAvailable) {
    try { return parseInt(await client.get(key)) || 0; } catch { return 0; }
  }
  const item = memoryStore.get(key);
  if (!item || (item.expiry && Date.now() > item.expiry)) return 0;
  return item.value;
}

/**
 * Delete counter
 */
export async function delCounter(key) {
  const client = getRedisClient();
  if (client && redisAvailable) {
    try { await client.del(key); } catch {}
  }
  memoryStore.delete(key);
}

/**
 * Check Redis health status
 */
export async function getRedisHealth() {
  const client = getRedisClient();
  if (!client || !redisAvailable) {
    return { status: 'In-Memory Mode', ok: false, message: 'Redis not configured or not connected' };
  }
  try {
    await client.ping();
    return { status: 'Connected', ok: true };
  } catch {
    return { status: 'Error', ok: false };
  }
}

/**
 * Cleanup expired in-memory entries (call periodically)
 */
export function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (item && item.expiry && now > item.expiry) {
      memoryStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryStore, 300000);
}
