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

    const weeklyInsight = await insightModel.getWeeklyInsightFromDB(userId, weekNumber);

    if (!weeklyInsight) {
      return res.status(200).json({
        status: 'success',
        data: {
          week_number: weekNumber,
          week_range: { from, to },
          mood_trend: [],
          fid_aggregates: [],
          summary: TEMPLATE_SUMMARY
        }
      });
    }

    const trendData = await logModel.getWeeklyFIDData(userId, from, to);

    const formattedTrend = trendData.map(item => ({
      day: new Date(item.log_date).toLocaleDateString('id-ID', { weekday: 'short' }),
      date: item.log_date,
      emotion: fidService.getEmotionIndonesia(item.emotion),
      intensity: Number(item.intensity) || 0
    }));

    const fidAggregates = fidService.aggregateWeeklyFID(trendData);

    res.status(200).json({
      status: 'success',
      data: {
        week_number: weekNumber,
        week_range: { from, to },
        mood_trend: formattedTrend,
        fid_aggregates: fidAggregates,
        summary: {
          text: weeklyInsight.summary_text,
          suggestion: weeklyInsight.suggestion_text || ''
        },
        mood_state: weeklyInsight.mood_state || 'Cukup'
      }
    });
  } catch (error) {
    next(error);
  }
};