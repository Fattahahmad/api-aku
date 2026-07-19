import express from 'express';
import { processWeeklySummary } from '../controllers/scheduler.controller.js';

const router = express.Router();

const rawBodyParser = express.raw({ type: 'application/json' });

router.post('/weekly-summary', rawBodyParser, async (req, res, next) => {
  try {
    const signature = req.header('Upstash-Signature');
    const body = req.body;
    
    // QStash signature verification
    if (signature && process.env.QSTASH_CURRENT_SIGNING_KEY) {
      const { Receiver } = await import('@upstash/qstash');
      const receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY
      });
      
      const host = req.headers.host;
      const originalUrl = `https://${host}${req.originalUrl}`;
      
      // Try original URL first
      try {
        await receiver.verify({ body, signature, url: originalUrl });
      } catch (err) {
        // If fails, allow Vercel preview URLs and custom domain to bypass
        // This handles: api-aku.vercel.app (custom) vs preview URLs
        if (host && (host.includes('vercel.app'))) {
          console.warn('Vercel URL verification failed, allowing for Vercel preview URL');
        } else {
          console.error('QStash signature verification failed:', err.message);
          return res.status(401).json({ status: 'fail', message: 'Invalid signature' });
        }
      }
    }

    req.body = {};
    next();
  } catch (err) {
    next(err);
  }
}, processWeeklySummary);