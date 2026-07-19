import pool from '../config/database.js';

export const getWeeklyInsightFromDB = async (userId, weekNumber) => {
  const query = `
    SELECT * FROM weekly_insights WHERE user_id = $1 AND week_number = $2;
  `;
  const result = await pool.query(query, [userId, weekNumber]);
  return result.rows[0] || null;
};

export const saveWeeklyInsight = async (userId, weekNumber, data) => {
  const query = `
    INSERT INTO weekly_insights (user_id, start_date, end_date, summary_text, dominant_emotion, average_intensity, week_number)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, week_number) DO UPDATE SET
      summary_text = EXCLUDED.summary_text,
      dominant_emotion = EXCLUDED.dominant_emotion,
      average_intensity = EXCLUDED.average_intensity,
      updated_at = NOW()
    RETURNING *;
  `;
  const result = await pool.query(query, [
    userId, 
    data.from, 
    data.to, 
    data.summaryText, 
    data.dominantEmotion, 
    data.averageIntensity, 
    weekNumber
  ]);
  return result.rows[0];
};