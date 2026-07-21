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

export const calculateDailyMoodScore = (emotion, intensity) => {
  const mappedIntensity = Math.ceil(intensity / 2); // 1-10 mapped to 1-5
  const emotionEn = Object.keys(EMOTION_INDONESIA).find(
    key => key.toLowerCase() === emotion.toLowerCase()
  ) || emotion;

  // 1. Positive Emotions
  if (emotionEn === 'Joy' || emotionEn === 'Trust') {
    return mappedIntensity;
  }

  // 2. Negative Emotions
  if (emotionEn === 'Sadness' || emotionEn === 'Fear' || emotionEn === 'Anger' || emotionEn === 'Disgust') {
    return 6 - mappedIntensity;
  }

  // 3. Neutral/Transition Emotions
  if (emotionEn === 'Surprise' || emotionEn === 'Anticipation') {
    if (mappedIntensity <= 3) {
      return 3;
    } else {
      return emotionEn === 'Anticipation' ? 4 : 3;
    }
  }

  // Fallback
  return 3;
};

export const calculateWeeklyMoodMetrics = (logs) => {
  if (!logs || logs.length === 0) {
    return {
      averageScore: 0,
      moodState: 'Belum Ada Data'
    };
  }

  let totalScore = 0;
  for (const log of logs) {
    totalScore += calculateDailyMoodScore(log.emotion, Number(log.intensity) || 0);
  }

  const averageScore = Number((totalScore / logs.length).toFixed(2));

  let moodState = 'Cukup';
  if (averageScore >= 4.0) {
    moodState = 'Sangat Baik';
  } else if (averageScore >= 3.0) {
    moodState = 'Baik';
  } else if (averageScore >= 2.5) {
    moodState = 'Cukup';
  } else if (averageScore >= 1.5) {
    moodState = 'Perlu Perhatian';
  } else {
    moodState = 'Sangat Perlu Perhatian';
  }

  return {
    averageScore,
    moodState
  };
};

export const buildFIDPrompt = (aggregates, weeklyMetrics) => {
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
  prompt += `\nEmosi dominan adalah "${topEmotionId}" dengan intensitas ${topEmotion.avgIntensity}/10 dan persistensi ${persistenceLabel}.\n`;

  if (weeklyMetrics) {
    prompt += `\nHasil perhitungan Rule-Based: Skor rata-rata suasana hati pengguna minggu ini adalah ${weeklyMetrics.averageScore}/5 dengan kategori status "${weeklyMetrics.moodState}".\n`;
  }

  prompt += `\nBerikan balasan HANYA dalam format JSON valid (tanpa blok markdown/backticks), dengan struktur murni seperti ini:\n{"summary": "ringkasan narasi tentang pola emosi user berdasarkan data di atas, maks 60 kata", "prediction": "prediksi tren mood user di masa depan secara singkat berdasarkan polanya, maks 30 kata", "suggestion": "saran kegiatan nyata yang sesuai untuk user, maks 40 kata"}`;

  return prompt;
};