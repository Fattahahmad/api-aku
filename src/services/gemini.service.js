import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getMoodLabel = (score) => {
  const labels = ['sangat sedih', 'sedih', 'down', 'netral', 'senang', 'sangat senang'];
  return labels[score] || 'netral';
};

export const generateDailySuggestion = async (moodScore, journalText) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const moodLabel = getMoodLabel(moodScore);
  const prompt = `Berikan 1-2 kalimat suggestion dalam bahasa Indonesia untuk user yang sedang memiliki mood "${moodLabel}" dengan jurnal: "${journalText || 'tidak ada jurnal'}". Fokus pada afirmasi atau aktivitas positif yang sesuai. Maksimal 20 kata.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini suggestion error:', error.message);
    return getDefaultSuggestion(moodScore);
  }
};

export const generateWeeklySummary = async (averageScore, emotionDistribution) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const emotions = emotionDistribution.map(e => e.emotion_label || e.emotion).join(', ') || 'tidak ada data';
  const prompt = `Ringkas dalam 2-3 kalimat bahasa Indonesia: user memiliki rata-rata mood ${averageScore}/5 dengan distribusi emosi: ${emotions}. Berikan insight dan saran. Maksimal 30 kata.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini weekly summary error:', error.message);
    return getDefaultWeeklySummary(averageScore);
  }
};

export const generateDashboardInsight = async (totalCheckins, averageMood, emotionTrend) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Buat insight singkat bahasa Indonesia (maksimal 25 kata) berdasarkan: ${totalCheckins} total check-in, rata-rata mood ${averageMood}/5, tren emosi terbaru: ${emotionTrend}. Fokus pada pola positif dan saran untuk dilanjutkan.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini dashboard insight error:', error.message);
    return "Terus jaga konsistensi track mood harian untuk insight yang lebih baik.";
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