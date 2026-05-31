import axios from 'axios';
import dotenv from 'dotenv';
import { getEmotionResult, cacheEmotionResult, incrementRateLimit } from './redis.service.js';

dotenv.config();

const HF_DAILY_URL = process.env.HF_DAILY_ENDPOINT;
const HF_WEEKLY_URL = process.env.HF_WEEKLY_ENDPOINT;

const mapEmotionToIndonesian = (emotion) => {
  const mapping = {
    sadness: 'sedih',
    joy: 'senang',
    anger: 'marah',
    fear: 'takut',
    love: 'cinta',
    surprise: 'terkejut',
    calm: 'tenang',
    content: 'puas',
    anxious: 'cemas',
    tired: 'lelah',
    excited: 'ekscited'
  };
  return mapping[emotion?.toLowerCase()] || 'netral';
};

export const analyzeDailyEmotion = async (journalText) => {
  if (!journalText) return { emotion: 'netral', confidence: 1.0 };
  
  const cached = await getEmotionResult(journalText);
  if (cached) return cached;
  
  try {
    const response = await axios.post(HF_DAILY_URL, { text: journalText });
    const result = response.data?.data || response.data;
    
    const emotion = mapEmotionToIndonesian(result.emotion || result.label);
    const confidence = result.confidence || 0.5;
    
    await cacheEmotionResult(journalText, emotion, confidence);
    return { emotion, confidence };
  } catch (error) {
    console.error('HF Daily API error:', error.message);
    return { emotion: 'netral', confidence: 0.5 };
  }
};

export const generateWeeklySummaryFromHF = async (weeklyLogs) => {
  if (!weeklyLogs || weeklyLogs.length === 0) {
    return "Belum ada data minggu ini.";
  }
  
  const formattedData = weeklyLogs.map(log => ({
    date: log.log_date || log.date,
    emotion: mapEmotionToIndonesian(log.emotion_label || log.emotion),
    confidence: log.confidence || 0.5
  }));

  try {
    const response = await axios.post(HF_WEEKLY_URL, formattedData);
    const summary = response.data?.summary || response.data?.text || "Semangat menjalani hari!";
    return typeof summary === 'string' ? summary : getDefaultSummary(formattedData);
  } catch (error) {
    console.error('HF Weekly API error:', error.message);
    return getDefaultSummary(formattedData);
  }
};

const getDefaultSummary = (data) => {
  const emotions = [...new Set(data.map(d => d.emotion))];
  if (emotions.length === 1) {
    return `Minggu ini dominan ${emotions[0]}. Pertahankan kebiasaan yang baik.`;
  }
  return "Ada variasi emosi minggu ini. Terus jaga keseimbangan.";
};