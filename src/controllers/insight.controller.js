import * as logModel from '../models/log.model.js';
import * as geminiService from '../services/gemini.service.js';
import * as fidService from '../services/fid.service.js';

export const getWeeklyInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const weekStart = new Date(wibNow.getTime() - 7 * 24 * 60 * 60 * 1000);

    const trendData = await logModel.getWeeklyFIDData(userId, weekStart.toISOString().split('T')[0], wibNow.toISOString().split('T')[0]);

    const formattedTrend = trendData.map(item => ({
      day: new Date(item.log_date).toLocaleDateString('id-ID', { weekday: 'short' }),
      date: item.log_date,
      emotion: item.emotion,
      intensity: Number(item.intensity) || 0,
      duration: Number(item.duration) || 0,
      fid_score: Number(item.fid_score) || 0
    }));

    const fidAggregates = fidService.aggregateWeeklyFID(trendData);
    const fidPrompt = fidService.buildFIDPrompt(fidAggregates);
    const aiSummary = await geminiService.generateWeeklyFIDSummary(fidPrompt, userId);

    res.status(200).json({
      status: 'success',
      data: {
        mood_trend: formattedTrend,
        fid_aggregates: fidAggregates,
        summary: {
          text: aiSummary,
          suggestion: "Pantau emosi dengan FID (Frekuensi, Intensitas, Durasi) secara konsisten."
        }
      }
    });
  } catch (error) {
    next(error);
  }
};