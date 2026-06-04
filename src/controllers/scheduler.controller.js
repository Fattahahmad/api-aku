import pool from '../config/database.js';
import * as insightModel from '../models/insight.model.js';
import * as aiModel from '../models/ai_analyses.model.js';
import * as geminiService from '../services/gemini.service.js';

export const processWeeklySummary = async (req, res, next) => {
  try {
    console.log('Processing weekly summary for all users...');

    const { rows: users } = await pool.query('SELECT id FROM users');
    const now = new Date();
    const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const weekStart = new Date(wibNow.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekNumber = `${wibNow.getFullYear()}-W${Math.ceil(wibNow.getDate() / 7)}`;
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = wibNow.toISOString().split('T')[0];

    const results = [];

    for (const user of users) {
      try {
        const trendData = await insightModel.getWeeklyMoodTrend(user.id);
        
        if (trendData.length === 0) continue;

        const avgScore = trendData.reduce((sum, t) => sum + parseFloat(t.avg_score), 0) / trendData.length;
        const emotions = trendData.map(t => t.avg_score >= 4 ? 'senang' : t.avg_score >= 2 ? 'netral' : 'sedih');

        const weeklyLogs = trendData.map(t => ({
          date: t.log_date,
          emotion: t.avg_score >= 4 ? 'joy' : t.avg_score >= 2 ? 'neutral' : 'sadness',
          confidence: 0.7
        }));

        const summary = await geminiService.generateWeeklySummary(avgScore, emotions.map(e => ({ emotion: e, count: 1 })), user.id);

        results.push({
          userId: user.id,
          status: 'processed',
          summary
        });
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err.message);
        results.push({ userId: user.id, status: 'error', error: err.message });
      }
    }

    res.status(200).json({
      status: 'success',
      processed: results.length,
      details: results
    });
  } catch (error) {
    next(error);
  }
};