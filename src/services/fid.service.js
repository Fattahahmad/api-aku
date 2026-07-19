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

export const calculatePersistence = (logs, targetEmotion) => {
  const emotionLogs = logs
    .filter(log => log.emotion === targetEmotion)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  if (emotionLogs.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < emotionLogs.length; i++) {
    const prevDate = new Date(emotionLogs[i - 1].created_at);
    const currDate = new Date(emotionLogs[i].created_at);
    
    const prevWIB = new Date(prevDate.getTime() + 7 * 60 * 60 * 1000);
    const currWIB = new Date(currDate.getTime() + 7 * 60 * 60 * 1000);
    
    const dayDiff = Math.round((currWIB - prevWIB) / (24 * 60 * 60 * 1000));
    
    if (dayDiff === 1) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
};

export const aggregateWeeklyFID = (logs) => {
  const aggregation = {};

  for (const log of logs) {
    const emotion = log.emotion;
    if (!aggregation[emotion]) {
      aggregation[emotion] = {
        emotion,
        count: 0,
        totalIntensity: 0
      };
    }
    aggregation[emotion].count += 1;
    aggregation[emotion].totalIntensity += Number(log.intensity) || 0;
  }

  const result = Object.values(aggregation).map(item => {
    const persistence = calculatePersistence(logs, item.emotion);
    return {
      emotion: item.emotion,
      emotionId: getEmotionIndonesia(item.emotion),
      frequency: item.count,
      avgIntensity: item.count > 0 ? (item.totalIntensity / item.count).toFixed(1) : 0,
      persistence
    };
  });

  return result.sort((a, b) => b.frequency - a.frequency);
};

const PERSISTENCE_LABELS = {
  1: 'sekitar 1 hari',
  2: '2 hari berturut-turut',
  3: '3 hari berturut-turut',
  4: '4 hari berturut-turut',
  5: '5 hari berturut-turut',
  6: '6 hari berturut-turut',
  7: 'sepanjang minggu'
};

export const buildFIDPrompt = (aggregates) => {
  if (aggregates.length === 0) {
    return "Belum ada data mood dalam seminggu ini.";
  }

  const topEmotion = aggregates[0];
  const topEmotionId = topEmotion.emotionId;
  const persistenceLabel = PERSISTENCE_LABELS[topEmotion.persistence] || `${topEmotion.persistence} hari berturut-turut`;

  let prompt = `Berdasarkan data mood minggu ini (Sen-Minggu):\n`;
  aggregates.forEach(item => {
    const pLabel = PERSISTENCE_LABELS[item.persistence] || `${item.persistence} hari berturut-turut`;
    prompt += `- emosi ${item.emotionId}: muncul ${item.frequency}x, intensitas rata-rata ${item.avgIntensity}/10, persistensi ${pLabel}\n`;
  });
  prompt += `\nEmosi dominan adalah "${topEmotionId}" dengan intensitas ${topEmotion.avgIntensity}/10 dan persistensi ${persistenceLabel}.\n\nBerikan balasan HANYA dalam format JSON valid (tanpa blok markdown/backticks), dengan struktur murni seperti ini:\n{"summary": "ringkasan narasi tentang pola emosi user, maks 60 kata", "suggestion": "saran kegiatan nyata untuk user, maks 40 kata"}`;

  return prompt;
};