import pool from '../config/database.js';

export const createAIAnalysis = async (userId, logId, inputType, emotion, confidence, rawResponse = null) => {
  const query = `
    INSERT INTO ai_analyses (user_id, log_id, input_type, emotion, confidence, raw_response)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, logId, inputType, emotion, confidence, rawResponse]);
  return result.rows[0];
};

export const getWeeklyAIAnalyses = async (userId, startDate, endDate) => {
  const query = `
    SELECT emotion, confidence, created_at
    FROM ai_analyses
    WHERE user_id = $1 AND input_type = 'daily'
      AND created_at >= $2 AND created_at <= $3
    ORDER BY created_at ASC;
  `;
  const result = await pool.query(query, [userId, startDate, endDate]);
  return result.rows;
};