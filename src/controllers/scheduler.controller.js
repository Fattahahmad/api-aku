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

const getDominantEmotion = (fidAggregates) => {
  if (fidAggregates.length === 0) return null;
  return fidService.getEmotionIndonesia(fidAggregates[0].emotion);
};

const getAverageIntensity = (trendData) => {
  if (trendData.length === 0) return 0;
  const sum = trendData.reduce((acc, item) => acc + Number(item.intensity || 0), 0);
  return Number((sum / trendData.length).toFixed(1));
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
          intensity: Number(item.intensity)
        }));

        const fidAggregates = fidService.aggregateWeeklyFID(trendData);

        if (fidAggregates.length === 0) {
          results.push({ userId: user.id, status: 'skipped', reason: 'no data' });
          continue;
        }

        const fidPrompt = fidService.buildFIDPrompt(fidAggregates);
        const aiSummary = await geminiService.generateWeeklyFIDSummary(fidPrompt, user.id);

        const dominantEmotion = getDominantEmotion(fidAggregates);
        const averageIntensity = getAverageIntensity(trendData);

        await pool.query(
          `INSERT INTO weekly_insights (user_id, start_date, end_date, summary_text, dominant_emotion, average_intensity, week_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id, week_number) DO UPDATE SET
             summary_text = EXCLUDED.summary_text,
             dominant_emotion = EXCLUDED.dominant_emotion,
             average_intensity = EXCLUDED.average_intensity,
             updated_at = NOW()`,
          [user.id, from, to, aiSummary.text, dominantEmotion, averageIntensity, weekNumber]
        );

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