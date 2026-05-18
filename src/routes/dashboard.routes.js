import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import requireAuth from '../middlewares/auth.middleware.js';

const router = express.Router();
router.get('/summary', requireAuth, dashboardController.getSummary);

export default router;