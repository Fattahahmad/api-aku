import express from 'express';
import { processWeeklySummary } from '../controllers/scheduler.controller.js';
import { processHFQueueHandler } from '../jobs/hf-worker.js';

const router = express.Router();

// Raw body parser khusus untuk QStash
const rawBodyParser = express.raw({ type: 'application/json' });

// Endpoint untuk QStash scheduler - weekly summary
router.post('/weekly-summary', rawBodyParser, async (req, res, next) => {
  try {
    const signature = req.header('Upstash-Signature');
    const body = req.body;
    const url = `${process.env.BASE_URL || 'http://localhost:3000'}${req.originalUrl}`;
    
    if (!signature) {
      return res.status(401).json({ status: 'fail', message: 'Signature header missing' });
    }

    const { Receiver } = await import('@upstash/qstash');
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY
    });

    try {
      await receiver.verify({ body, signature, url });
    } catch (err) {
      console.error('QStash signature verification failed:', err.message);
      return res.status(401).json({ status: 'fail', message: 'Invalid signature' });
    }

    // Parse JSON setelah verify
    const parsedBody = JSON.parse(body.toString());
    req.body = parsedBody;
    next();
  } catch (err) {
    next(err);
  }
}, processWeeklySummary);

// Endpoint untuk QStash scheduler - HF queue worker
router.post('/process-hf', rawBodyParser, async (req, res, next) => {
  try {
    const signature = req.header('Upstash-Signature');
    const body = req.body;
    const url = `${process.env.BASE_URL || 'http://localhost:3000'}${req.originalUrl}`;
    
    if (!signature) {
      return res.status(401).json({ status: 'fail', message: 'Signature header missing' });
    }

    const { Receiver } = await import('@upstash/qstash');
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY
    });

    try {
      await receiver.verify({ body, signature, url });
    } catch (err) {
      console.error('QStash signature verification failed:', err.message);
      return res.status(401).json({ status: 'fail', message: 'Invalid signature' });
    }

    const parsedBody = JSON.parse(body.toString());
    req.body = parsedBody;
    next();
  } catch (err) {
    next(err);
  }
}, processHFQueueHandler);

export default router;