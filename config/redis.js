import { createClient } from "redis";

let client = null;

export async function initRedis() {
  if (client) return client;

  client = createClient({
    username: "default",
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  });

  client.on("error", (err) => console.log("Redis Client Error", err));

  await client.connect().then(() => {
    console.log("Redis connected");
  });

  return client;
}

export function getRedisClient() {
  if (!client) {
    throw new Error("Redis client not initialized");
  }
  return client;
}
