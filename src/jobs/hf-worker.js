import * as hfService from '../services/hf.service.js';
import * as logModel from '../models/log.model.js';
import * as aiModel from '../models/ai_analyses.model.js';
import { getQueuedPrediction } from '../services/redis.service.js';

export const processHFQueue = async () => {
  const job = await getQueuedPrediction();
  if (!job) return { processed: false, reason: 'queue empty' };

  const { userId, logId, journalText } = job;
  
  try {
    const hfResult = await hfService.analyzeDailyEmotion(journalText);
    
    if (hfResult && hfResult.emotion) {
      await logModel.updateLogEmotion(logId, hfResult.emotion);
      await aiModel.createAIAnalysis(userId, logId, 'daily', hfResult.emotion, hfResult.confidence);
    }

    return { processed: true, job, hfResult };
  } catch (error) {
    console.error('Queue processing error:', error.message);
    return { processed: false, error: error.message };
  }
};

export const processHFQueueHandler = async (req, res, next) => {
  try {
    const result = await processHFQueue();
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};