import cron from 'node-cron';
import * as aiModel from '../models/ai_analyses.model.js';
import * as hfService from '../services/hf.service.js';
import pool from '../config/database.js';

export const startWeeklyScheduler = () => {
  const job = cron.schedule('0 1 * * 0', async () => {
    console.log('Running weekly HF summary job...');
    await runWeeklyJob();
  }, {
    scheduled: false,
    timezone: 'Asia/Jakarta'
  });
   
  job.start();
};

const runWeeklyJob = async () => {
  const { rows: users } = await pool.query('SELECT id FROM users');
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (const user of users) {
    try {
      const aiAnalyses = await aiModel.getWeeklyAIAnalyses(
        user.id,
        weekAgo.toISOString().split('T')[0],
        now.toISOString().split('T')[0]
      );
      
      if (aiAnalyses.length > 0) {
        const weeklyLogs = aiAnalyses.map(a => ({
          date: a.created_at.toISOString().split('T')[0],
          emotion: a.emotion,
          confidence: parseFloat(a.confidence)
        }));
        
        await hfService.generateWeeklySummaryFromHF(weeklyLogs);
      }
    } catch (err) {
      console.error(`Error processing user ${user.id}:`, err.message);
    }
  }
  
  console.log('Weekly HF job completed');
};

export const triggerWeeklyForScheduler = async () => {
  await runWeeklyJob();
};

export const triggerWeeklyManually = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const aiAnalyses = await aiModel.getWeeklyAIAnalyses(
      userId,
      weekAgo.toISOString().split('T')[0],
      now.toISOString().split('T')[0]
    );
    
    const weeklyLogs = aiAnalyses.map(a => ({
      date: a.created_at.toISOString().split('T')[0],
      emotion: a.emotion,
      confidence: parseFloat(a.confidence)
    }));
    
    const summary = await hfService.generateWeeklySummaryFromHF(weeklyLogs);
    
    res.status(200).json({
      status: 'success',
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
};