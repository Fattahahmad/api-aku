import app from '../src/app.js';

export default async function handler(req, res) {
  try {
    return app(req, res);
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}