import express from 'express';
import * as insightController from '../controllers/insight.controller.js';
import requireAuth from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/weekly', requireAuth, insightController.getWeeklyInsights);

export default router;