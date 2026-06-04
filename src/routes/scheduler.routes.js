import express from 'express';
import { triggerWeeklyForScheduler } from '../jobs/hf-scheduler.js';
import { processHFQueueHandler } from '../jobs/hf-worker.js';

const router = express.Router();

router.post('/weekly-summary', async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const expected = process.env.QSTASH_CURRENT_SIGNING_KEY;
    
    if (!authHeader || authHeader !== `Bearer ${expected}`) {
      return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    }
    
    await triggerWeeklyForScheduler();
    res.status(200).json({ status: 'success', message: 'Weekly summary processed' });
  } catch (error) {
    next(error);
  }
});

router.post('/process-hf', processHFQueueHandler);

export default router;