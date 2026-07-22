import * as logModel from '../models/log.model.js';
import * as fidService from '../services/fid.service.js';
import * as insightModel from '../models/insight.model.js';

import { getWeekBoundaries } from '../utils/date.util.js';

const TEMPLATE_SUMMARY = {
  text: 'Summary minggu ini belum tersedia. Silakan tunggu hingga hari Minggu pukul 01:00 WIB.',
  suggestion: 'Lanjutkan mencatat mood harian Anda. Summary akan otomatis ter-generate setiap akhir minggu.'
};

export const getWeeklyInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to, weekNumber } = getWeekBoundaries();

    const trendData = await logModel.getWeeklyFIDData(userId, from, to);

    const formattedTrend = trendData.map(item => ({
      day: new Date(item.log_date).toLocaleDateString('id-ID', { weekday: 'short' }),
      date: item.log_date,
      emotion: fidService.getEmotionIndonesia(item.emotion),
      intensity: Number(item.intensity) || 0
    }));

    const fidAggregates = fidService.aggregateWeeklyFID(trendData);
    const weeklyMetrics = fidService.calculateWeeklyMoodMetrics(trendData);

    const weeklyInsight = await insightModel.getWeeklyInsightFromDB(userId, weekNumber);

    const summaryData = weeklyInsight ? {
      text: weeklyInsight.summary_text,
      suggestion: weeklyInsight.suggestion_text || ''
    } : TEMPLATE_SUMMARY;

    const moodState = weeklyInsight
      ? (weeklyInsight.mood_state || weeklyMetrics.moodState)
      : (trendData.length > 0 ? weeklyMetrics.moodState : 'Cukup');

    res.status(200).json({
      status: 'success',
      data: {
        week_number: weekNumber,
        week_range: { from, to },
        mood_trend: formattedTrend,
        fid_aggregates: fidAggregates,
        summary: summaryData,
        mood_state: moodState
      }
    });
  } catch (error) {
    next(error);
  }
};