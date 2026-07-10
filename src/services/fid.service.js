const DURATION_LABELS = { 1: '<1 jam', 2: 'setengah hari', 3: 'seharian penuh' };
const EMOTION_INDONESIA = {
  Joy: 'senang',
  Sadness: 'sedih',
  Trust: 'percaya',
  Disgust: 'jijik',
  Fear: 'takut',
  Anger: 'marah',
  Surprise: 'terkejut',
  Anticipation: 'antisipasi'
};

export const getEmotionIndonesia = (emotionEn) => {
  return EMOTION_INDONESIA[emotionEn] || emotionEn.toLowerCase();
};

export const calculateFIDScore = (intensity, duration) => {
  return intensity * duration;
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
    emotionId: getEmotionIndonesia(item.emotion),
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
  const topEmotionId = topEmotion.emotionId;
  const durationLabel = DURATION_LABELS[Math.round(topEmotion.avgDuration)] || 'tidak diketahui';

  let prompt = `Berdasarkan data mood minggu ini (Sen-Minggu):\n`;
  aggregates.forEach(item => {
    prompt += `- emosi ${item.emotionId}: muncul ${item.frequency}x, intensitas rata-rata ${item.avgIntensity}/10, durasi rata-rata ${item.avgDuration}\n`;
  });
  prompt += `\nEmosi dominan adalah "${topEmotionId}" dengan intensitas ${topEmotion.avgIntensity}/10 dan durasi ${durationLabel}.\n\nBerikan dalam format berikut (gunakan bahasa Indonesia):\nSUMMARY: [tuliskan ringkasan narasi lengkap tentang pola emosi user, maksimal 60 kata]\nSARAN: [tuliskan saran kegiatan yang bisa dilakukan user untuk menyeimbangkan emosi ini, maksimal 40 kata]`;

  return prompt;
};