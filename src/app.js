// src/app.js
import express from 'express';
import cors from 'cors';
import errorHandler from './middlewares/error.middleware.js'; // Import middleware

const app = express();

app.use(cors()); 
app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Welcome to MoodMate API! Please refer to the documentation for available endpoints.');
});

app.get('/api/v1', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to MoodMate API v1! ',
  });
});

// NANTI: Import dan pasang routes auth, journal, insight di sini...

// WAJIB DI PALING BAWAH: Pasang Error Handler
app.use(errorHandler);

export default app;