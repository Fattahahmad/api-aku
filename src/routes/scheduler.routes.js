import express from 'express';
import { processWeeklySummary } from '../controllers/scheduler.controller.js';

const router = express.Router();

// Raw body parser khusus untuk QStash
const rawBodyParser = express.raw({ type: 'application/json' });

// Helper verify QStash signature
const verifyQStash = async (req, res) => {
  const signature = req.header('Upstash-Signature');
  const body = req.body;
  const url = `https://${req.headers.host}${req.originalUrl}`;
  
  if (!signature) {
    return { error: 'Signature header missing' };
  }

  const { Receiver } = await import('@upstash/qstash');
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY
  });

  try {
    await receiver.verify({ body, signature, url });
    return { valid: true };
  } catch (err) {
    console.error('QStash signature verification failed:', err.message);
    return { error: 'Invalid signature' };
  }
};

// Endpoint untuk QStash scheduler - weekly summary
router.post('/weekly-summary', rawBodyParser, async (req, res, next) => {
  try {
    const { error, valid } = await verifyQStash(req, res);
    if (error) {
      return res.status(401).json({ status: 'fail', message: error });
    }

    // Parse body jika ada
    if (req.body && req.body.length > 0) {
      try {
        req.body = JSON.parse(req.body.toString('utf-8'));
      } catch (e) {
        req.body = {};
      }
    } else {
      req.body = {};
    }

    next();
  } catch (err) {
    next(err);
  }
}, processWeeklySummary);

export default router;