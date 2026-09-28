import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
});

export const roomKey = (roomId: string) => `room:${roomId}`;

export async function addSocketToRoom(
  roomId: string,
  socketId: string
): Promise<void> {
  await redis.sadd(roomKey(roomId), socketId);
}

export async function removeSocketFromRoom(
  roomId: string,
  socketId: string
): Promise<void> {
  await redis.srem(roomKey(roomId), socketId);
}

export async function getRoomCount(roomId: string): Promise<number> {
  return redis.scard(roomKey(roomId));
}

export async function deleteRoom(roomId: string): Promise<void> {
  await redis.del(roomKey(roomId));
}

export async function checkRedisConnection(): Promise<string> {
  return redis.ping();
}

export default redis;