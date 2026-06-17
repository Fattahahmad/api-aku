// server.js
import app from './app.js';
import pool from './config/database.js';
import { connectRedis } from './services/redis.service.js';
import 'dotenv/config';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    console.log('Berhasil terhubung ke database PostgreSQL (MoodMate)');

    connectRedis().catch(() => {});

    const server = app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`Menerima ${signal}. Menutup server...`);
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Gagal terhubung:', err.message);
    process.exit(1);
  }
};

startServer();

export default app;