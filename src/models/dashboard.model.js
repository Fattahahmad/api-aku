import pool from '../config/database.js';

export const getDashboardStats = async (userId) => {
  const query = `
    SELECT 
      COUNT(id) AS total_checkins,
      ROUND(AVG(intensity), 1) AS average_intensity
    FROM daily_logs
    WHERE user_id = $1;
  `;
  const result = await pool.query(query, [userId]);
  return {
    totalCheckins: parseInt(result.rows[0].total_checkins || 0, 10),
    averageIntensity: parseFloat(result.rows[0].average_intensity || 0)
  };
};