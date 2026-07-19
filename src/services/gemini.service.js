import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { getRedisClient } from './redis.service.js';
import * as fidService from './fid.service.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

const getModelWithFallback = () => {
  for (const modelName of GEMINI_MODELS) {
    try {
      return genAI.getGenerativeModel({ model: modelName });
    } catch {
      continue;
    }
  }
  return genAI.getGenerativeModel({ model: GEMINI_MODELS[0] });
};

const getCacheKey = (prefix, userId, date = null) => {
  const d = date || new Date().toISOString().split('T')[0];
  return `${prefix}:${userId}:${d}`;
};

const getGeminiCache = async (key) => {
  try {
    const redis = getRedisClient();
    if (redis) {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch {
    return null;
  }
};

const setGeminiCache = async (key, data) => {
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.setEx(key, 86400, JSON.stringify(data));
    }
  } catch {}
};

const getDefaultSuggestionEmotion = (emotion) => {
  const lower = emotion.toLowerCase();
  if (lower.includes('joy') || lower.includes('trust')) return "Pertahankan energi positif ini! Lanjutkan kebiasaan baik.";
  if (lower.includes('surprise') || lower.includes('anticipation')) return "Raih harapan baru dengan langkah kecil.";
  return "Sedikit napas dalam dan ingatlah ini akan berlalu. Kamu kuat.";
};

export const generateDailySuggestion = async (emotion, intensity, journalText, userId) => {
  const cacheKey = getCacheKey('daily_suggestion', userId);
  const cached = await getGeminiCache(cacheKey);
  if (cached) return cached;

  const model = getModelWithFallback();
  const emotionId = fidService.getEmotionIndonesia(emotion);
  const prompt = `Berikan 1-2 kalimat suggestion dalam bahasa Indonesia (maksimal 20 kata) untuk user yang sedang merasa "${emotionId}" dengan intensitas ${intensity}/10. Jurnal: "${journalText || 'tidak ada jurnal'}". Fokus pada afirmasi atau aktivitas positif yang sesuai.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    await setGeminiCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error('Gemini suggestion error:', error.message);
    const defaultText = getDefaultSuggestionEmotion(emotion);
    await setGeminiCache(cacheKey, defaultText);
    return defaultText;
  }
};

export const generateWeeklyFIDSummary = async (fidPrompt, userId) => {
  const cacheKey = getCacheKey('weekly_fid_summary', userId);
  const cached = await getGeminiCache(cacheKey);
  if (cached) return cached;

  const model = getModelWithFallback();
  try {
    const result = await model.generateContent(fidPrompt);
    const response = await result.response;
    const fullText = response.text().trim();

    const summaryMatch = fullText.match(/SUMMARY:\s*([\s\S]*?)(?:\nSARAN:|$)/i);
    const suggestionMatch = fullText.match(/SARAN:\s*([\s\S]*?)$/i);

    const parsed = {
      text: summaryMatch ? summaryMatch[1].trim() : fullText,
      suggestion: suggestionMatch ? suggestionMatch[1].trim() : ''
    };

    await setGeminiCache(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.error('Gemini FID weekly summary error:', error.message);
    return {
      text: "Minggu ini pantau emosi dengan lebih konsisten.",
      suggestion: "Catat setiap perubahan emosi ya."
    };
  }
};

export const generateDashboardInsight = async (totalCheckins, avgIntensity, fidTrend, userId) => {
  const cacheKey = getCacheKey('dashboard_insight', userId);
  const cached = await getGeminiCache(cacheKey);
  if (cached) return cached;

  const model = getModelWithFallback();
  const topEmotions = fidTrend.slice(0, 3).map(e => fidService.getEmotionIndonesia(e.emotion)).join(', ') || 'belum ada data';
  const prompt = `Buat insight dalam bahasa Indonesia (maksimal 25 kata) berdasarkan: ${totalCheckins} total check-in, rata-rata intensitas ${avgIntensity}/10, emosi terakhir: ${topEmotions}. Fokus pada pola positif.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    await setGeminiCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error('Gemini dashboard insight error:', error.message);
    const defaultText = "Terus jaga konsistensi track mood harian untuk insight yang lebih baik.";
    await setGeminiCache(cacheKey, defaultText);
    return defaultText;
  }
};