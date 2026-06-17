import pool from '../config/database.js';

export const getHabits = async (userId) => {
  const query = `
    SELECT 
      h.id,
      h.user_id,
      h.title,
      h.description,
      h.target_date,
      h.created_at,
      h.updated_at,
      COUNT(hc.id) AS total_completions
    FROM habits h
    LEFT JOIN habit_completions hc ON hc.habit_id = h.id
    WHERE h.user_id = $1
    GROUP BY h.id
    ORDER BY h.created_at DESC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

export const getHabitById = async (userId, habitId) => {
  const query = `
    SELECT * FROM habits
    WHERE id = $1 AND user_id = $2;
  `;
  const result = await pool.query(query, [habitId, userId]);
  return result.rows[0];
};

export const createHabit = async (userId, title, description, targetDate) => {
  const query = `
    INSERT INTO habits (user_id, title, description, target_date)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, title, description, targetDate]);
  return result.rows[0];
};

export const updateHabit = async (userId, habitId, title, description, targetDate) => {
  const query = `
    UPDATE habits
    SET 
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      target_date = COALESCE($3, target_date),
      updated_at = NOW()
    WHERE id = $4 AND user_id = $5
    RETURNING *;
  `;
  const result = await pool.query(query, [title, description, targetDate, habitId, userId]);
  return result.rows[0];
};

export const deleteHabit = async (userId, habitId) => {
  const query = `
    DELETE FROM habits
    WHERE id = $1 AND user_id = $2;
  `;
  const result = await pool.query(query, [habitId, userId]);
  return result.rowCount;
};

export const getCompletion = async (userId, habitId, completedAt) => {
  const query = `
    SELECT * FROM habit_completions
    WHERE user_id = $1 AND habit_id = $2 AND completed_at = $3;
  `;
  const result = await pool.query(query, [userId, habitId, completedAt]);
  return result.rows[0];
};

export const createCompletion = async (userId, habitId, completedAt, note) => {
  const query = `
    INSERT INTO habit_completions (user_id, habit_id, completed_at, note)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, habit_id, completed_at) DO NOTHING
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, habitId, completedAt, note]);
  return result.rows[0];
};

export const deleteCompletion = async (userId, habitId, completedAt) => {
  const query = `
    DELETE FROM habit_completions
    WHERE user_id = $1 AND habit_id = $2 AND completed_at = $3;
  `;
  const result = await pool.query(query, [userId, habitId, completedAt]);
  return result.rowCount;
};

export const getCompletionsByRange = async (userId, habitId, from, to) => {
  const query = `
    SELECT id, habit_id, user_id, completed_at, note, created_at
    FROM habit_completions
    WHERE user_id = $1 AND habit_id = $2
      AND completed_at >= $3
      AND completed_at <= $4
    ORDER BY completed_at DESC;
  `;
  const result = await pool.query(query, [userId, habitId, from, to]);
  return result.rows;
};

export const getDailyCompletionsByRange = async (userId, from, to) => {
  const query = `
    SELECT completed_at::text AS date, COUNT(id)::int AS count
    FROM habit_completions
    WHERE user_id = $1
      AND completed_at >= $2
      AND completed_at <= $3
    GROUP BY completed_at
    ORDER BY completed_at ASC;
  `;
  const result = await pool.query(query, [userId, from, to]);
  return result.rows;
};

export const getTotalCompletionsByRange = async (userId, from, to) => {
  const query = `
    SELECT COUNT(id)::int AS total
    FROM habit_completions
    WHERE user_id = $1
      AND completed_at >= $2
      AND completed_at <= $3;
  `;
  const result = await pool.query(query, [userId, from, to]);
  return parseInt(result.rows[0].total, 10);
};

export const getActiveHabitsCount = async (userId) => {
  const query = `
    SELECT COUNT(id)::int AS total
    FROM habits
    WHERE user_id = $1;
  `;
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].total, 10);
};

export const getHabitsWithDatesInRange = async (userId, from, to) => {
  const query = `
    SELECT h.id, h.title, h.description, h.target_date, hc.completed_at
    FROM habits h
    LEFT JOIN habit_completions hc
      ON hc.habit_id = h.id
      AND hc.user_id = h.user_id
      AND hc.completed_at >= $2
      AND hc.completed_at <= $3
    WHERE h.user_id = $1
    ORDER BY h.created_at DESC, hc.completed_at ASC;
  `;
  const result = await pool.query(query, [userId, from, to]);
  return result.rows;
};

export const getBestStreakInRange = async (userId, from, to) => {
  const query = `
    SELECT h.id, h.title, hc.completed_at::text AS completed_at
    FROM habits h
    LEFT JOIN habit_completions hc
      ON hc.habit_id = h.id
      AND hc.user_id = h.user_id
      AND hc.completed_at >= $2
      AND hc.completed_at <= $3
    WHERE h.user_id = $1
    ORDER BY h.created_at DESC, hc.completed_at ASC;
  `;
  const result = await pool.query(query, [userId, from, to]);
  return result.rows;
};
