import pool from '../config/database.js';
import InvariantError from '../exceptions/InvariantError.js';

const getWIBDate = () => {
  const now = new Date();
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return wibTime.toISOString().split('T')[0];
};

export const createDailyLog = async (userId, emotion, intensity, journalText) => {
  const query = `
    INSERT INTO daily_logs (user_id, emotion, intensity, journal_text) 
    VALUES ($1, $2, $3, $4) 
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [userId, emotion, intensity, journalText]);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new InvariantError('Anda sudah melakukan check-in hari ini. Silakan edit log yang tersedia jika ingin mengubah data.');
    }
    throw error;
  }
};

export const updateLogEmotion = async (logId, emotion) => {
  const query = `
    UPDATE daily_logs 
    SET emotion = $1, updated_at = NOW() 
    WHERE id = $2 
    RETURNING *;
  `;
  const result = await pool.query(query, [emotion, logId]);
  return result.rows[0];
};

export const getWeeklyFIDData = async (userId, weekStart, weekEnd) => {
  const query = `
    SELECT 
      DATE(created_at + INTERVAL '7 hours') as log_date,
      emotion,
      intensity,
      created_at
    FROM daily_logs
    WHERE user_id = $1 
      AND DATE(created_at + INTERVAL '7 hours') >= $2
      AND DATE(created_at + INTERVAL '7 hours') <= $3
    ORDER BY created_at ASC;
  `;
  const result = await pool.query(query, [userId, weekStart, weekEnd]);
  return result.rows;
};

export const checkLogToday = async (userId) => {
  const todayWIB = getWIBDate();
  
  const query = `
    SELECT id, user_id, emotion, intensity, journal_text, created_at
    FROM daily_logs 
    WHERE user_id = $1 
      AND DATE(created_at + INTERVAL '7 hours') = $2
    LIMIT 1;
  `;
  const result = await pool.query(query, [userId, todayWIB]);
  return result.rows[0] || null;
};

export const getMonthlyLogs = async (userId, month, year) => {
  const query = `
    SELECT 
      (created_at + INTERVAL '7 hours')::date as log_date, 
      emotion,
      intensity,
      journal_text
    FROM daily_logs 
    WHERE user_id = $1 
      AND EXTRACT(MONTH FROM (created_at + INTERVAL '7 hours')) = $2
      AND EXTRACT(YEAR FROM (created_at + INTERVAL '7 hours')) = $3
    ORDER BY created_at ASC;
  `;
  const result = await pool.query(query, [userId, month, year]);
  return result.rows;
};

export const getRecentFIDTrend = async (userId, limit = 5) => {
  const query = `
    SELECT emotion, intensity, created_at
    FROM daily_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  const result = await pool.query(query, [userId, limit]);
  return result.rows;
};

export const getLogByDate = async (userId, dateString) => {
  const query = `
    SELECT id, user_id, emotion, intensity, journal_text, created_at, updated_at
    FROM daily_logs 
    WHERE user_id = $1 AND DATE(created_at + INTERVAL '7 hours') = $2;
  `;
  const result = await pool.query(query, [userId, dateString]);
  return result.rows[0];
};

export const getLogById = async (logId) => {
  const query = `SELECT id, user_id, emotion, intensity, journal_text, created_at, updated_at FROM daily_logs WHERE id = $1;`;
  const result = await pool.query(query, [logId]);
  return result.rows[0];
};

export const updateDailyLog = async (logId, emotion, intensity, journalText) => {
  const query = `
    UPDATE daily_logs 
    SET emotion = $1, intensity = $2, journal_text = $3, updated_at = NOW() 
    WHERE id = $4 
    RETURNING *;
  `;
  const result = await pool.query(query, [emotion, intensity, journalText, logId]);
  return result.rows[0];
};

export const updateDailyLogWithOwnership = async (logId, userId, emotion, intensity, journalText) => {
  const query = `
    UPDATE daily_logs 
    SET emotion = $1, intensity = $2, journal_text = $3, updated_at = NOW() 
    WHERE id = $4 AND user_id = $5
    RETURNING *;
  `;
  const result = await pool.query(query, [emotion, intensity, journalText, logId, userId]);
  return result.rows[0] || null;
};

export const deleteDailyLog = async (logId) => {
  const query = `DELETE FROM daily_logs WHERE id = $1;`;
  await pool.query(query, [logId]);
};

export const deleteDailyLogWithOwnership = async (logId, userId) => {
  const query = `
    DELETE FROM daily_logs 
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const result = await pool.query(query, [logId, userId]);
  return result.rows[0] || null;
};

export const getJournalHistory = async (userId, month, year, limit, offset) => {
  const query = `
    SELECT id, user_id, emotion, intensity, journal_text, created_at, updated_at
    FROM daily_logs
    WHERE user_id = $1
      AND ($2::int IS NULL OR EXTRACT(MONTH FROM created_at) = $2)
      AND ($3::int IS NULL OR EXTRACT(YEAR FROM created_at) = $3)
    ORDER BY created_at DESC
    LIMIT $4 OFFSET $5;
  `;

  const result = await pool.query(query, [
    userId, 
    month || null, 
    year || null, 
    limit, 
    offset
  ]);
  return result.rows;
};

export const countJournalHistory = async (userId, month, year) => {
  const query = `
    SELECT COUNT(id) FROM daily_logs
    WHERE user_id = $1
      AND ($2::int IS NULL OR EXTRACT(MONTH FROM created_at) = $2)
      AND ($3::int IS NULL OR EXTRACT(YEAR FROM created_at) = $3);
  `;
  const result = await pool.query(query, [
    userId, 
    month || null, 
    year || null
  ]);
  return parseInt(result.rows[0].count, 10);
};

export const getRecentEmotionTrend = async (userId, limit = 5) => {
  const query = `
    SELECT emotion, intensity, created_at
    FROM daily_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  const result = await pool.query(query, [userId, limit]);
  return result.rows;
};