// src/app.js
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors()); 
app.use(express.json()); 

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to MoodMate API!',
  });
});

app.get('/api/v1', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to MoodMate API! Please refer to the documentation for available endpoints.',
  });
});

export default app;