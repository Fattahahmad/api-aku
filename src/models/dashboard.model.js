import pool from '../config/database.js';

export const getDashboardStats = async (userId) => {
  const query = `
    SELECT 
      COUNT(id) AS total_checkins,
      ROUND(AVG(mood_score), 1) AS average_mood
    FROM daily_logs
    WHERE user_id = $1;
  `;
  const result = await pool.query(query, [userId]);
  return {
    totalCheckins: parseInt(result.rows[0].total_checkins || 0, 10),
    averageMood: parseFloat(result.rows[0].average_mood || 0)
  };
};