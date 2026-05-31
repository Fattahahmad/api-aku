import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient;

export const connectRedis = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    await redisClient.connect();
    console.log('Connected to Redis');
  }
  return redisClient;
};

export const getRedisClient = () => redisClient;

export const cacheDailyPrediction = async (userId, logId, data) => {
  if (!redisClient) return;
  await redisClient.setEx(`pending_prediction:${userId}:${logId}`, 3600, JSON.stringify(data));
};

export const getDailyPrediction = async (userId, logId) => {
  if (!redisClient) return null;
  const data = await redisClient.get(`pending_prediction:${userId}:${logId}`);
  return data ? JSON.parse(data) : null;
};

export const cacheEmotionResult = async (journalText, emotion, confidence) => {
  if (!redisClient) return;
  const key = `emotion:${Buffer.from(journalText).toString('base64').slice(0, 32)}`;
  await redisClient.setEx(key, 86400, JSON.stringify({ emotion, confidence }));
};

export const getEmotionResult = async (journalText) => {
  if (!redisClient) return null;
  const key = `emotion:${Buffer.from(journalText).toString('base64').slice(0, 32)}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const cacheWeeklyData = async (userId, weekKey, data) => {
  if (!redisClient) return;
  await redisClient.setEx(`weekly_data:${userId}:${weekKey}`, 604800, JSON.stringify(data));
};

export const getWeeklyData = async (userId, weekKey) => {
  if (!redisClient) return null;
  const data = await redisClient.get(`weekly_data:${userId}:${weekKey}`);
  return data ? JSON.parse(data) : null;
};

export const incrementRateLimit = async (key, limit = 60) => {
  if (!redisClient) return 0;
  const current = await redisClient.incr(key);
  if (current === 1) {
    await redisClient.expire(key, 60);
  }
  return current > limit ? limit : current;
};