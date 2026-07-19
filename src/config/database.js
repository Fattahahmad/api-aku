import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
  // Di Vercel (serverless), kita set koneksi maksimal ke 1 agar tidak menguras kuota Supabase
  max: process.env.VERCEL ? 1 : Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 10000), // Dipercepat menjadi 10 detik agar koneksi lekas dilepas
  connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT || 10000)
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

export default pool;