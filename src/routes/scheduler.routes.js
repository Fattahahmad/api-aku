import express from 'express';
import { processWeeklySummary } from '../controllers/scheduler.controller.js';
import { triggerWeeklyForScheduler } from '../jobs/hf-scheduler.js';
import { processHFQueueHandler } from '../jobs/hf-worker.js';
import { verifyQStashSignature } from '../middlewares/qstash.middleware.js';

const router = express.Router();

// Endpoint untuk QStash scheduler - weekly summary
router.post('/weekly-summary', verifyQStashSignature, processWeeklySummary);

// Endpoint untuk QStash scheduler - HF queue worker
router.post('/process-hf', verifyQStashSignature, processHFQueueHandler);

export default router;