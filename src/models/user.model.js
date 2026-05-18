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
  // COALESCE digunakan agar jika parameter nilainya null, data lama di database tidak tertimpa
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