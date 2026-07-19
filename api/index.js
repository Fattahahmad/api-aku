import app from '../src/app.js';
import pool from '../src/config/database.js';
import { connectRedis } from '../src/services/redis.service.js';

let isConnected = false;

const connectDB = async () => {
  if (!isConnected) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('PostgreSQL connected');
      isConnected = true;
    } catch (err) {
      console.error('DB connection error:', err.message);
    }
  }
};

export default async function handler(req, res) {
  try {
    await connectDB();
    connectRedis().catch(() => {});
    return app(req, res);
  } catch (err) {
    console.error('Serverless handler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}