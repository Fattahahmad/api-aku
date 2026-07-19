import * as dashboardModel from '../models/dashboard.model.js';
import * as userModel from '../models/user.model.js';
import * as logModel from '../models/log.model.js';
import * as geminiService from '../services/gemini.service.js';
import * as fidService from '../services/fid.service.js';

export const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [stats, user, recentLogs] = await Promise.all([
      dashboardModel.getDashboardStats(userId),
      userModel.findUserById(userId),
      logModel.getRecentFIDTrend(userId, 5)
    ]);

    const recentEmotions = recentLogs.map(l => ({
      emotion: fidService.getEmotionIndonesia(l.emotion),
      intensity: Number(l.intensity) || 0
    }));

    const aiInsight = await geminiService.generateDashboardInsight(
      stats.totalCheckins,
      stats.averageIntensity,
      recentEmotions,
      userId
    );

    res.status(200).json({
      status: 'success',
      data: {
        user_name: user.name.split(' ')[0],
        total_checkins: stats.totalCheckins,
        average_intensity: stats.averageIntensity,
        current_streak: user.current_streak || 0,
        recent_emotions: recentEmotions,
        recent_insight: aiInsight
      }
    });
  } catch (error) {
    next(error);
  }
};