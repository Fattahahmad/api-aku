import * as dashboardModel from '../models/dashboard.model.js';
import * as userModel from '../models/user.model.js';

export const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [stats, user] = await Promise.all([
      dashboardModel.getDashboardStats(userId),
      userModel.findUserById(userId)
    ]);
    let moodLabel = "Neutral";
    if (stats.averageMood >= 4) moodLabel = "Great";
    else if (stats.averageMood >= 3) moodLabel = "Good";
    else if (stats.averageMood >= 2) moodLabel = "Content";
    else if (stats.averageMood >= 1) moodLabel = "Down";
    else if (stats.averageMood > 0) moodLabel = "Low";
    else if (stats.totalCheckins === 0) moodLabel = "No Data";

    res.status(200).json({
      status: 'success',
      data: {
        user_name: user.name.split(' ')[0], 
        total_checkins: stats.totalCheckins,
        average_mood_score: stats.averageMood,
        average_mood_label: moodLabel,
        current_streak: user.current_streak || 0,
      }
    });
  } catch (error) {
    next(error);
  }
};