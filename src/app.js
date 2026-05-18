import express from 'express';
import cors from 'cors';
import errorHandler from './middlewares/error.middleware.js'; 
import authRoutes from './routes/auth.routes.js';
import logRoutes from './routes/log.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import insightRoutes from './routes/insight.routes.js';
import userRoutes from './routes/user.routes.js';
import path from 'path';

const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to MoodMate API! Please use /api/v1 for the latest version of the API.',
  });
});

app.get('/api/v1', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to MoodMate API v1! ',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/insights', insightRoutes);
app.use('/api/v1/users', userRoutes);

app.use(errorHandler);

export {app};
export default app;