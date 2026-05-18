import * as insightModel from '../models/insight.model.js';

export const getWeeklyInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [trendData, emotionData] = await Promise.all([
      insightModel.getWeeklyMoodTrend(userId),
      insightModel.getWeeklyEmotionDistribution(userId)
    ]);

    const formattedTrend = trendData.map(item => ({
      day: item.day_name,
      date: item.log_date,
      score: parseFloat(item.avg_score)
    }));

    const fallbackEmotionDistribution = emotionData.length > 0 ? emotionData : [
      { emotion: "Calm", count: 4 },
      { emotion: "Content", count: 3 },
      { emotion: "Anxious", count: 2 },
      { emotion: "Tired", count: 1 }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        mood_trend: formattedTrend,
        emotion_distribution: fallbackEmotionDistribution,
        summary: {
          text: "A steady week with calm as your dominant state. A brief dip mid-week may relate to your Wednesday workload. Your overall trend points gently upward.",
          suggestion: "protect a short walk in the afternoon."
        }
      }
    });
  } catch (error) {
    next(error);
  }
};