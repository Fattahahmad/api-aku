import pool from '../config/database.js';

const getWIBDate = () => {
  const now = new Date();
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return wibTime.toISOString().split('T')[0];
};

export const createDailyLog = async (userId, moodScore, journalText) => {
  const query = `
    INSERT INTO daily_logs (user_id, mood_score, journal_text) 
    VALUES ($1, $2, $3) 
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, moodScore, journalText]);
  return result.rows[0];
};

export const updateLogEmotion = async (logId, emotionLabel) => {
  const query = `
    UPDATE daily_logs 
    SET emotion_label = $1, updated_at = NOW() 
    WHERE id = $2 
    RETURNING *;
  `;
  const result = await pool.query(query, [emotionLabel, logId]);
  return result.rows[0];
};

export const getLogsForWeeklyAnalysis = async (userId, weekStart, weekEnd) => {
  const query = `
    SELECT 
      DATE(created_at + INTERVAL '7 hours') as log_date,
      emotion_label,
      mood_score
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
  const now = new Date();
  const utcHours = now.getUTCHours();
  const wibHours = utcHours + 7;
  
  const utcMidnightWIB = new Date(now);
  utcMidnightWIB.setUTCHours(17, 0, 0, 0);
  
  if (wibHours >= 24) {
    utcMidnightWIB.setUTCDate(utcMidnightWIB.getUTCDate() + 1);
  } else if (utcHours < 17) {
    utcMidnightWIB.setUTCDate(utcMidnightWIB.getUTCDate() - 1);
  }
  
  const utcNextDayWIB = new Date(utcMidnightWIB);
  utcNextDayWIB.setUTCDate(utcNextDayWIB.getUTCDate() + 1);
  
  const query = `
    SELECT id, user_id, mood_score, journal_text, created_at, emotion_label
    FROM daily_logs 
    WHERE user_id = $1 
      AND created_at >= $2 
      AND created_at < $3;
  `;
  const result = await pool.query(query, [userId, utcMidnightWIB, utcNextDayWIB]);
  
  const todayWIB = getWIBDate();
  return result.rows.find(log => {
    const logDateUTC = new Date(log.created_at);
    const logWIB = new Date(logDateUTC.getTime() + (7 * 60 * 60 * 1000));
    return logWIB.toISOString().split('T')[0] === todayWIB;
  });
};

export const getMonthlyLogs = async (userId, month, year) => {
  const query = `
    SELECT 
      (created_at + INTERVAL '7 hours')::date as log_date, 
      mood_score
    FROM daily_logs 
    WHERE user_id = $1 
      AND EXTRACT(MONTH FROM (created_at + INTERVAL '7 hours')) = $2 
      AND EXTRACT(YEAR FROM (created_at + INTERVAL '7 hours')) = $3
    ORDER BY created_at ASC;
  `;
  const result = await pool.query(query, [userId, month, year]);
  return result.rows;
};

export const getLogByDate = async (userId, dateString) => {
  const query = `
    SELECT * FROM daily_logs 
    WHERE user_id = $1 AND DATE(created_at) = $2;
  `;
  const result = await pool.query(query, [userId, dateString]);
  return result.rows[0];
};

export const getLogById = async (logId) => {
  const query = `SELECT * FROM daily_logs WHERE id = $1;`;
  const result = await pool.query(query, [logId]);
  return result.rows[0];
};

export const updateDailyLog = async (logId, moodScore, journalText) => {
  const query = `
    UPDATE daily_logs 
    SET mood_score = $1, journal_text = $2, updated_at = NOW() 
    WHERE id = $3 
    RETURNING *;
  `;
  const result = await pool.query(query, [moodScore, journalText, logId]);
  return result.rows[0];
};

export const deleteDailyLog = async (logId) => {
  const query = `DELETE FROM daily_logs WHERE id = $1;`;
  await pool.query(query, [logId]);
};

export const getJournalHistory = async (userId, month, year, limit, offset) => {
  const query = `
    SELECT * FROM daily_logs
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
    SELECT mood_score, emotion_label, created_at
    FROM daily_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  const result = await pool.query(query, [userId, limit]);
  return result.rows;
};