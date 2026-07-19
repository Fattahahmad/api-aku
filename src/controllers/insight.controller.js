import * as logModel from '../models/log.model.js';
import * as fidService from '../services/fid.service.js';
import * as insightModel from '../models/insight.model.js';

const getWeekBoundaries = () => {
  const now = new Date();
  const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const dayOfWeek = wibNow.getDay();

  const sundayWIB = new Date(wibNow);
  sundayWIB.setDate(sundayWIB.getDate() + (7 - dayOfWeek));
  sundayWIB.setHours(0, 0, 0, 0);

  const mondayWIB = new Date(sundayWIB);
  mondayWIB.setDate(mondayWIB.getDate() - 6);

  return {
    from: mondayWIB.toISOString().split('T')[0],
    to: sundayWIB.toISOString().split('T')[0],
    weekNumber: `${sundayWIB.getFullYear()}-W${Math.ceil((sundayWIB.getDate() + (sundayWIB.getMonth() + 1) * 7) / 7)}`
  };
};

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
          suggestion: ''
        }
      }
    });
  } catch (error) {
    next(error);
  }
};