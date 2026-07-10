import pool from '../config/database.js';
import * as logModel from '../models/log.model.js';
import * as fidService from '../services/fid.service.js';
import * as geminiService from '../services/gemini.service.js';

const getWeekBoundaries = () => {
  const now = new Date();
  const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const dayOfWeek = wibNow.getDay();

  const sundayWIB = new Date(wibNow);
  sundayWIB.setDate(sundayWIB.getDate() - dayOfWeek);
  sundayWIB.setHours(0, 0, 0, 0);

  const mondayWIB = new Date(sundayWIB);
  mondayWIB.setDate(mondayWIB.getDate() - 6);

  return {
    from: mondayWIB.toISOString().split('T')[0],
    to: sundayWIB.toISOString().split('T')[0],
    weekNumber: `${sundayWIB.getFullYear()}-W${Math.ceil((sundayWIB.getDate() + (sundayWIB.getMonth() + 1) * 7) / 7)}`
  };
};

export const processWeeklySummary = async (req, res, next) => {
  try {
    console.log('Processing weekly summary for all users...');

    const { rows: users } = await pool.query('SELECT id FROM users');
    const { from, to, weekNumber } = getWeekBoundaries();

    const results = [];

    for (const user of users) {
      try {
        const trendData = await logModel.getWeeklyFIDData(user.id, from, to);

        const formattedTrend = trendData.map(item => ({
          emotion: fidService.getEmotionIndonesia(item.emotion),
          intensity: Number(item.intensity),
          duration: Number(item.duration)
        }));

        const fidAggregates = fidService.aggregateWeeklyFID(trendData);

        if (fidAggregates.length === 0) {
          results.push({ userId: user.id, status: 'skipped', reason: 'no data' });
          continue;
        }

        const fidPrompt = fidService.buildFIDPrompt(fidAggregates);
        const aiSummary = await geminiService.generateWeeklyFIDSummary(fidPrompt, user.id);

        results.push({
          userId: user.id,
          status: 'processed',
          data: { weekNumber, summary: aiSummary }
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