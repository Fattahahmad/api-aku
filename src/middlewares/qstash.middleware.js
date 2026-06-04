import { Receiver } from '@upstash/qstash';
import dotenv from 'dotenv';

dotenv.config();

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY
});

export const verifyQStashSignature = async (req, res, next) => {
  try {
    const signature = req.header('Upstash-Signature');
    const body = JSON.stringify(req.body);
    
    if (!signature) {
      return res.status(401).json({ status: 'fail', message: 'Signature header missing' });
    }

    await receiver.verify({
      body,
      signature,
      url: `${process.env.BASE_URL || 'http://localhost:3000'}${req.originalUrl}`,
    });

    next();
  } catch (error) {
    console.error('QStash signature verification failed:', error.message);
    return res.status(401).json({ status: 'fail', message: 'Invalid signature' });
  }
};