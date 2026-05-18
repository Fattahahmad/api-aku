// src/routes/log.routes.js
import express from 'express';
import * as logController from '../controllers/log.controller.js';
import requireAuth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createLogSchema } from '../validators/log.validator.js';

const router = express.Router();

router.post('/', requireAuth, validate(createLogSchema), logController.createLog);
router.get('/today', requireAuth, logController.getTodayStatus);
router.get('/calendar', requireAuth, logController.getCalendarLogs);
router.get('/date/:date', requireAuth, logController.getLogDetail);
router.put('/:id', requireAuth, validate(createLogSchema), logController.updateLog);
router.delete('/:id', requireAuth, logController.deleteLog);
router.get('/', requireAuth, logController.getAllLogs);


export default router;