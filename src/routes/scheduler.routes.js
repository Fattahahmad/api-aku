import express from 'express';
import { processWeeklySummary } from '../controllers/scheduler.controller.js';

const router = express.Router();

router.post('/weekly-summary', async (req, res, next) => {
  try {
    const signature = req.header('Upstash-Signature');
    
    // QStash signature verification
    if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
      if (!signature) {
        return res.status(401).json({ status: 'fail', message: 'Missing Upstash-Signature header' });
      }

      const { Receiver } = await import('@upstash/qstash');
      const receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY
      });
      
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const originalUrl = `${protocol}://${host}${req.originalUrl}`;
      
      try {
        // Karena string kosong "" bernilai falsy di JS, jika req.rawBody === "",
        // penggunaan || (OR) akan lompat ke JSON.stringify(req.body) yang menghasilkan "{}".
        // Kita harus menggunakan ?? (nullish coalescing) agar string kosong tetap diterima.
        const payloadBody = req.rawBody ?? (Object.keys(req.body || {}).length > 0 ? JSON.stringify(req.body) : '');
        
        await receiver.verify({ 
          body: payloadBody, 
          signature, 
          url: originalUrl 
        });
      } catch (err) {
        console.error('QStash signature verification failed:', err.message);
        return res.status(401).json({ status: 'fail', message: 'Invalid signature: ' + err.message });
      }
    } else {
      console.warn('QSTASH_CURRENT_SIGNING_KEY is not set. Skipping verification (Not recommended in production).');
    }

    next();
  } catch (err) {
    next(err);
  }
}, processWeeklySummary);

export default router;