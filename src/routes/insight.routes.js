import express from 'express';
import { getWeeklyInsights } from '../controllers/insight.controller.js';
import requireAuth from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/weekly', requireAuth, getWeeklyInsights);

export default router;