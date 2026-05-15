// server.js
import app from './app.js';
import pool from './config/database.js';
import 'dotenv/config';

const PORT = process.env.PORT || 3000;

pool.connect()
  .then(() => {
    console.log('Berhasil terhubung ke database PostgreSQL (MoodMate)');
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Gagal terhubung ke database:', err.message);
    process.exit(1); 
  });