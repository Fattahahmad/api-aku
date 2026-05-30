// src/models/user.model.js
import pool from '../config/database.js';

export const findUserByEmail = async (email) => {
  const query = `
    SELECT * FROM users 
    WHERE email = $1;
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0]; 
};

export const createUser = async (name, email, hashedPassword) => {
  const query = `
    INSERT INTO users (name, email, password) 
    VALUES ($1, $2, $3) 
    RETURNING id, name, email, current_streak, created_at;
  `;

  const result = await pool.query(query, [name, email, hashedPassword]);
  return result.rows[0];
};


export const findUserById = async (id) => {
const query = `SELECT * FROM users WHERE id = $1;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const updateUserProfile = async (userId, name, avatarUrl) => {
  const query = `
    UPDATE users 
    SET 
      name = COALESCE($1, name), 
      avatar_url = COALESCE($2, avatar_url),
      updated_at = NOW()
    WHERE id = $3
    RETURNING id, name, email, avatar_url;
  `;
  const result = await pool.query(query, [name, avatarUrl, userId]);
  return result.rows[0];
};

export const updateUserStreak = async (userId) => {
  const query = `
    UPDATE users 
    SET 
      current_streak = CASE 
        WHEN last_checkin_date IS NULL THEN 1
        WHEN last_checkin_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
        WHEN last_checkin_date = CURRENT_DATE THEN current_streak
        ELSE 1
      END,
      last_checkin_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = $1
    RETURNING current_streak, last_checkin_date;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

export const resetUserStreak = async (userId) => {
  const query = `
    UPDATE users 
    SET 
      current_streak = 0,
      last_checkin_date = NULL,
      updated_at = NOW()
    WHERE id = $1;
  `;
  await pool.query(query, [userId]);
};