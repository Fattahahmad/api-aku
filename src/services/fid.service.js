import pool from '../config/database.js';

const DURATION_LABELS = { 1: '<1 jam', 2: 'setengah hari', 3: 'seharian penuh' };
const FID_EMOTIONS = ['Joy', 'Sadness', 'Trust', 'Disgust', 'Fear', 'Anger', 'Surprise', 'Anticipation'];

export const calculateFIDScore = (intensity, duration) => {
  return intensity * duration;
};

export const getWeeklyFIDData = async (userId, from, to) => {
  const query = `
    SELECT 
      emotion,
      intensity,
      duration,
      fid_score,
      created_at
    FROM daily_logs
    WHERE user_id = $1 
      AND DATE(created_at + INTERVAL '7 hours') >= $2
      AND DATE(created_at + INTERVAL '7 hours') <= $3
    ORDER BY created_at ASC;
  `;
  const result = await pool.query(query, [userId, from, to]);
  return result.rows;
};

export const aggregateWeeklyFID = (logs) => {
  const aggregation = {};

  for (const log of logs) {
    const emotion = log.emotion;
    if (!aggregation[emotion]) {
      aggregation[emotion] = {
        emotion,
        count: 0,
        totalIntensity: 0,
        totalDuration: 0,
        scores: []
      };
    }
    aggregation[emotion].count += 1;
    aggregation[emotion].totalIntensity += Number(log.intensity) || 0;
    aggregation[emotion].totalDuration += Number(log.duration) || 0;
    aggregation[emotion].scores.push(Number(log.fid_score) || 0);
  }

  const result = Object.values(aggregation).map(item => ({
    emotion: item.emotion,
    frequency: item.count,
    avgIntensity: item.count > 0 ? (item.totalIntensity / item.count).toFixed(1) : 0,
    avgDuration: item.count > 0 ? (item.totalDuration / item.count).toFixed(1) : 0,
    avgFidScore: item.count > 0 ? (item.scores.reduce((a, b) => a + b, 0) / item.count).toFixed(1) : 0
  }));

  return result.sort((a, b) => b.frequency - a.frequency);
};

export const buildFIDPrompt = (aggregates) => {
  if (aggregates.length === 0) {
    return "Belum ada data mood dalam seminggu ini.";
  }

  const topEmotion = aggregates[0];
  const durationLabel = DURATION_LABELS[Math.round(topEmotion.avgDuration)] || 'tidak diketahui';

  let prompt = `Berdasarkan data mood 7 hari terakhir:\n`;
  aggregates.forEach(item => {
    prompt += `- ${item.emotion}: frekuensi ${item.frequency}x/minggu, rata-rata intensitas ${item.avgIntensity}/10, rata-rata durasi ${item.avgDuration}\n`;
  });
  prompt += `\nBerikan insight singkat (maksimal 30 kata) tentang emosi dominan user dan saran untuk menyeimbangkan seminggu depan.`;

  return prompt;
};

export const buildDashboardFIDPrompt = (totalLogs, avgIntensity, avgDuration, recentEmotions) => {
  const avgFidScore = avgIntensity * avgDuration;
  const emotionStr = recentEmotions.length > 0
    ? recentEmotions.map(e => e.emotion).join(', ')
    : 'belum ada data';

  return `Buat insight singkat (maksimal 25 kata) berdasarkan: ${totalLogs} total check-in, rata-rata fid score ${avgFidScore.toFixed(1)}, emosi terakhir: ${emotionStr}. Fokus pada pola positif.`;
};