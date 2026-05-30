// src/models/insight.model.js
import pool from '../config/database.js';

export const getWeeklyMoodTrend = async (userId) => {
  const query = `
    SELECT 
      TO_CHAR(created_at + INTERVAL '7 hours', 'Dy') AS day_name,
      (created_at + INTERVAL '7 hours')::date AS log_date,
      ROUND(AVG(mood_score), 1) AS avg_score
    FROM daily_logs
    WHERE user_id = $1 
      AND created_at + INTERVAL '7 hours' >= (CURRENT_DATE - INTERVAL '7 days')
    GROUP BY (created_at + INTERVAL '7 hours')::date, TO_CHAR(created_at + INTERVAL '7 hours', 'Dy')
    ORDER BY log_date ASC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

const getMoodLabel = (score) => {
  const labels = ['sangat sedih', 'sedih', 'down', 'netral', 'senang', 'sangat senang'];
  return labels[score] || 'tidak diketahui';
};

export const getWeeklyEmotionDistribution = async (userId) => {
  const query = `
    SELECT 
      mood_score, 
      COUNT(*) as count
    FROM daily_logs
    WHERE user_id = $1 
      AND created_at + INTERVAL '7 hours' >= (CURRENT_DATE - INTERVAL '7 days')
    GROUP BY mood_score
    ORDER BY mood_score ASC;
  `;
  const result = await pool.query(query, [userId]);
  
  return result.rows.map(row => ({
    emotion_label: getMoodLabel(row.mood_score),
    value: row.mood_score,
    count: row.count
  }));
};