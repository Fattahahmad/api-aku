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

export const generateDailySuggestion = async (moodScore, journalText, userId) => {
  const cacheKey = getCacheKey('daily_suggestion', userId);
  const cached = await getGeminiCache(cacheKey);
  if (cached) return cached;

  const model = getModelWithFallback();
  const moodLabel = getMoodLabel(moodScore);
  const prompt = `Berikan 1-2 kalimat suggestion dalam bahasa Indonesia untuk user yang sedang memiliki mood "${moodLabel}" dengan jurnal: "${journalText || 'tidak ada jurnal'}". Fokus pada afirmasi atau aktivitas positif yang sesuai. Maksimal 20 kata.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    await setGeminiCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error('Gemini suggestion error:', error.message);
    const defaultText = getDefaultSuggestion(moodScore);
    await setGeminiCache(cacheKey, defaultText);
    return defaultText;
  }
};

export const generateWeeklySummary = async (averageScore, emotionDistribution, userId) => {
  const cacheKey = getCacheKey('weekly_summary', userId);
  const cached = await getGeminiCache(cacheKey);
  if (cached) return cached;

  const model = getModelWithFallback();
  const emotions = emotionDistribution.map(e => e.emotion_label || e.emotion).join(', ') || 'tidak ada data';
  const prompt = `Ringkas dalam 2-3 kalimat bahasa Indonesia: user memiliki rata-rata mood ${averageScore}/5 dengan distribusi emosi: ${emotions}. Berikan insight dan saran. Maksimal 30 kata.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    await setGeminiCache(cacheKey, text);
    return text;
  } catch (error) {
    console.error('Gemini weekly summary error:', error.message);
    const defaultText = getDefaultWeeklySummary(averageScore);
    await setGeminiCache(cacheKey, defaultText);
    return defaultText;
  }
};

export const generateDashboardInsight = async (totalCheckins, averageMood, emotionTrend, userId) => {
  const cacheKey = getCacheKey('dashboard_insight', userId);
  const cached = await getGeminiCache(cacheKey);
  if (cached) return cached;

  const model = getModelWithFallback();
  const prompt = `Buat insight singkat bahasa Indonesia (maksimal 25 kata) berdasarkan: ${totalCheckins} total check-in, rata-rata mood ${averageMood}/5, tren emosi terbaru: ${emotionTrend}. Fokus pada pola positif dan saran untuk dilanjutkan.`;

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

const getDefaultSuggestion = (moodScore) => {
  if (moodScore >= 4) return "Pertahankan energi positif ini! Terus nikmati hari yang indah.";
  if (moodScore >= 2) return "Coba lakukan aktivitas kecil yang disukai untuk menyegarkan mood.";
  return "Sedikit napas dalam dan ingatlah ini akan berlalu. Kamu kuat.";
};

const getDefaultWeeklySummary = (averageScore) => {
  if (averageScore >= 4) return "Minggu ini mood terkendali positif. Pertahankan kebiasaan baik ini.";
  if (averageScore >= 2) return "Ada fluktuasi mood minggu ini. Coba rutinitas yang menstabilkan.";
  return "Minggu ini terasa berat. Besok pasti lebih baik, semangat ya.";
};