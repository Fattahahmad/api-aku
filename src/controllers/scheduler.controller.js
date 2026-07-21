import pool from '../config/database.js';
import * as logModel from '../models/log.model.js';
import * as fidService from '../services/fid.service.js';
import * as geminiService from '../services/gemini.service.js';
import * as insightModel from '../models/insight.model.js';

const BATCH_SIZE = 10;

import { getWeekBoundaries } from '../utils/date.util.js';

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

    const { rows: users } = await pool.query(`SELECT id FROM users LIMIT ${BATCH_SIZE}`);
    const { from, to, weekNumber } = getWeekBoundaries();

    const results = [];

    for (const user of users) {
      try {
        const trendData = await logModel.getWeeklyFIDData(user.id, from, to);
        const fidAggregates = fidService.aggregateWeeklyFID(trendData);

        if (fidAggregates.length === 0) {
          results.push({ userId: user.id, status: 'skipped', reason: 'no data' });
          continue;
        }

        const weeklyMetrics = fidService.calculateWeeklyMoodMetrics(trendData);
        const fidPrompt = fidService.buildFIDPrompt(fidAggregates, weeklyMetrics);
        const aiSummary = await geminiService.generateWeeklyFIDSummaryForScheduler(fidPrompt, user.id);

        const dominantEmotion = getDominantEmotion(fidAggregates);
        const averageIntensity = getAverageIntensity(trendData);

        await insightModel.saveWeeklyInsight(user.id, weekNumber, {
          from,
          to,
          summaryText: aiSummary.text,
          dominantEmotion,
          averageIntensity,
          suggestionText: aiSummary.suggestion,
          moodState: weeklyMetrics.moodState
        });

        results.push({
          userId: user.id,
          status: 'processed',
          data: { weekNumber }
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
    console.error('Scheduler error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
};