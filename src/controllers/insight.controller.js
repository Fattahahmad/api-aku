import * as insightModel from '../models/insight.model.js';
import * as aiModel from '../models/ai_analyses.model.js';
import * as geminiService from '../services/gemini.service.js';
import * as hfService from '../services/hf.service.js';

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

    const emotionDistribution = emotionData.length > 0 
      ? emotionData.map(e => ({
          emotion: e.emotion_label,
          count: e.count
        }))
      : [];

    const avgScore = formattedTrend.length > 0 
      ? formattedTrend.reduce((sum, t) => sum + t.score, 0) / formattedTrend.length 
      : 0;

    const now = new Date();
    const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const weekStart = new Date(wibNow.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const aiAnalyses = await aiModel.getWeeklyAIAnalyses(
      userId,
      weekStart.toISOString().split('T')[0],
      wibNow.toISOString().split('T')[0]
    );

    const weeklyLogs = aiAnalyses.length > 0
      ? aiAnalyses.map(a => ({
          date: a.created_at.toISOString().split('T')[0],
          emotion: a.emotion,
          confidence: parseFloat(a.confidence) || 0.5
        }))
      : [];

    const hfSummary = await hfService.generateWeeklySummaryFromHF(weeklyLogs);
    const aiSummary = hfSummary || await geminiService.generateWeeklySummary(avgScore, emotionDistribution, userId);

    res.status(200).json({
      status: 'success',
      data: {
        mood_trend: formattedTrend,
        emotion_distribution: emotionDistribution,
        summary: {
          text: aiSummary,
          suggestion: "Terus jaga konsistensi track mood untuk insight yang lebih baik."
        }
      }
    });
  } catch (error) {
    next(error);
  }
};