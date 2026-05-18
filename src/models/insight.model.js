// src/models/insight.model.js
import pool from '../config/database.js';

export const getWeeklyMoodTrend = async (userId) => {
  const query = `
    SELECT 
      TO_CHAR(created_at, 'Dy') AS day_name, -- Output: 'Mon', 'Tue', dll.
      DATE(created_at) AS log_date,
      ROUND(AVG(mood_score), 1) AS avg_score
    FROM daily_logs
    WHERE user_id = $1 
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(created_at), TO_CHAR(created_at, 'Dy')
    ORDER BY log_date ASC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

export const getWeeklyEmotionDistribution = async (userId) => {
  const query = `
    SELECT 
      emotion_label, 
      COUNT(*) as count
    FROM daily_logs
    WHERE user_id = $1 
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND emotion_label IS NOT NULL
    GROUP BY emotion_label
    ORDER BY count DESC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};