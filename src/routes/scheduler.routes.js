import express from 'express';
import { processWeeklySummary } from '../controllers/scheduler.controller.js';

const router = express.Router();

const rawBodyParser = express.raw({ type: 'application/json' });

router.post('/weekly-summary', rawBodyParser, async (req, res, next) => {
  try {
    const signature = req.header('Upstash-Signature');
    const body = req.body;
    
    const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY || process.env.QSTASH_NEXT_SIGNING_KEY;
    
    if (signature && signingKey) {
      const { Receiver } = await import('@upstash/qstash');
      const receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY
      });
      
      const vercelUrl = process.env.VERCEL_URL;
      const protocol = vercelUrl ? 'https' : 'http';
      const host = vercelUrl || req.headers.host || 'localhost:3000';
      const url = `${protocol}://${host}${req.originalUrl}`;
      
      try {
        await receiver.verify({ body, signature, url });
      } catch (err) {
        console.error('QStash signature verification failed:', err.message);
        return res.status(401).json({ status: 'fail', message: 'Invalid signature' });
      }
    }

    req.body = {};
    next();
  } catch (err) {
    next(err);
  }
}, processWeeklySummary);

export default router;