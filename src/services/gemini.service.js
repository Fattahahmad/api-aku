import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite'
];

let currentModelIndex = 0;

const getModelWithFallback = () => {
  const modelName = GEMINI_MODELS[currentModelIndex];
  try {
    return genAI.getGenerativeModel({ model: modelName });
  } catch {
    if (currentModelIndex < GEMINI_MODELS.length - 1) {
      currentModelIndex++;
      return genAI.getGenerativeModel({ model: GEMINI_MODELS[currentModelIndex] });
    }
    return genAI.getGenerativeModel({ model: GEMINI_MODELS[0] });
  }
};

const getCacheKey = (prefix, userId, date = null) => {
  const d = date || new Date().toISOString().split('T')[0];
  return `${prefix}:${userId}:${d}`;
};

const getGeminiCache = async (key) => {
  try {
    const mod = await import('../services/redis.service.js');
    const redis = mod.getRedisClient();
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
    const mod = await import('../services/redis.service.js');
    const redis = mod.getRedisClient();
    if (redis) {
      await redis.setEx(key, 86400, JSON.stringify(data));
    }
  } catch {}
};

const getMoodLabel = (score) => {
  const labels = ['sangat sedih', 'sedih', 'down', 'netral', 'senang', 'sangat senang'];
  return labels[score] || 'netral';
};

const getDefaultSuggestion = (emotion) => {
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
  const prompt = `Berikan 1-2 kalimat suggestion dalam bahasa Indonesia untuk user yang sedang merasakan "${emotion}" dengan intensitas ${intensity}/10. Jurnal: "${journalText || 'tidak ada jurnal'}". Fokus pada afirmasi atau aktivitas positif yang sesuai. Maksimal 20 kata.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    await setGeminiCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error('Gemini suggestion error:', error.message);
    const defaultText = getDefaultSuggestion(emotion);
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
    const text = response.text().trim();
    await setGeminiCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error('Gemini FID weekly summary error:', error.message);
    const defaultText = "Minggu ini pantau emosi dengan lebih konsisten. Terus semangat ya.";
    await setGeminiCache(cacheKey, defaultText);
    return defaultText;
  }
};

export const generateDashboardInsight = async (totalCheckins, avgFidScore, fidTrend, userId) => {
  const cacheKey = getCacheKey('dashboard_insight', userId);
  const cached = await getGeminiCache(cacheKey);
  if (cached) return cached;

  const model = getModelWithFallback();
  const topEmotions = fidTrend.slice(0, 3).map(e => e.emotion).join(', ') || 'belum ada data';
  const prompt = `Buat insight singkat bahasa Indonesia (maksimal 25 kata) berdasarkan: ${totalCheckins} total check-in, rata-rata FID score ${avgFidScore}, emosi terakhir: ${topEmotions}. Fokus pada pola positif.`;

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