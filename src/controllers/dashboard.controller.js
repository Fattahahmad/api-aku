import * as dashboardModel from '../models/dashboard.model.js';
import * as userModel from '../models/user.model.js';
import * as logModel from '../models/log.model.js';
import * as geminiService from '../services/gemini.service.js';

export const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [stats, user, recentLogs] = await Promise.all([
      dashboardModel.getDashboardStats(userId),
      userModel.findUserById(userId),
      logModel.getRecentEmotionTrend(userId, 5)
    ]);
    
    let moodLabel = "Tidak ada data";
    if (stats.totalCheckins > 0) {
      if (stats.averageMood >= 4) moodLabel = "Sangat senang";
      else if (stats.averageMood >= 3) moodLabel = "Senang";
      else if (stats.averageMood >= 2) moodLabel = "Netral";
      else if (stats.averageMood >= 1) moodLabel = "Sedih";
      else moodLabel = "Sangat sedih";
    }

    const recentEmotionTrend = recentLogs.length > 0
      ? recentLogs.map(l => l.emotion_label || ['sangat sedih', 'sedih', 'down', 'netral', 'senang', 'sangat senang'][l.mood_score]).join(', ')
      : 'baru memulai';

    const aiInsight = await geminiService.generateDashboardInsight(
      stats.totalCheckins, 
      stats.averageMood, 
      recentEmotionTrend,
      userId
    );

    res.status(200).json({
      status: 'success',
      data: {
        user_name: user.name.split(' ')[0], 
        total_checkins: stats.totalCheckins,
        average_mood_score: stats.averageMood,
        average_mood_label: moodLabel,
        current_streak: user.current_streak || 0,
        recent_insight: aiInsight
      }
    });
  } catch (error) {
    next(error);
  }
};