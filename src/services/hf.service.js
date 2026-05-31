import axios from 'axios';
import dotenv from 'dotenv';
import { getEmotionResult, cacheEmotionResult, incrementRateLimit } from './redis.service.js';

dotenv.config();

const HF_DAILY_URL = process.env.HF_DAILY_ENDPOINT;
const HF_WEEKLY_URL = process.env.HF_WEEKLY_ENDPOINT;

export const analyzeDailyEmotion = async (journalText) => {
  if (!journalText) return { emotion: 'neutral', confidence: 1.0 };
  
  const cached = await getEmotionResult(journalText);
  if (cached) return cached;
  
  try {
    const response = await axios.post(HF_DAILY_URL, { text: journalText });
    const result = response.data?.data || response.data;
    
    const emotion = result.emotion || result.label || 'neutral';
    const confidence = result.confidence || 0.5;
    
    await cacheEmotionResult(journalText, emotion, confidence);
    return { emotion, confidence };
  } catch (error) {
    console.error('HF Daily API error:', error.message);
    return { emotion: 'neutral', confidence: 0.5 };
  }
};

export const generateWeeklySummaryFromHF = async (weeklyLogs) => {
  if (!weeklyLogs || weeklyLogs.length === 0) {
    return "Belum ada data minggu ini.";
  }
  
  try {
    const response = await axios.post(HF_WEEKLY_URL, weeklyLogs);
    const summary = response.data?.summary || response.data?.text || "Semangat menjalani hari!";
    return typeof summary === 'string' ? summary : getDefaultSummary(weeklyLogs);
  } catch (error) {
    console.error('HF Weekly API error:', error.message);
    return getDefaultSummary(weeklyLogs);
  }
};

const getDefaultSummary = (data) => {
  const emotions = [...new Set(data.map(d => d.emotion))];
  if (emotions.length === 1) {
    return `Minggu ini dominan ${emotions[0]}. Pertahankan kebiasaan yang baik.`;
  }
  return "Ada variasi emosi minggu ini. Terus jaga keseimbangan.";
};