import express from 'express';
import * as habitController from '../controllers/habit.controller.js';
import requireAuth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createHabitSchema,
  updateHabitSchema,
  habitIdSchema,
  createCompletionSchema,
  completionDateQuerySchema,
  completionRangeQuerySchema
} from '../validators/habit.validator.js';

const router = express.Router();

router.get('/summary', requireAuth, validate(completionRangeQuerySchema, 'query'), habitController.getHabitSummary);
router.get('/insights', requireAuth, validate(completionRangeQuerySchema, 'query'), habitController.getHabitInsights);
router.get('/', requireAuth, habitController.getHabits);
router.post('/', requireAuth, validate(createHabitSchema), habitController.createHabit);
router.get('/:id', requireAuth, validate(habitIdSchema, 'params'), habitController.getHabitById);
router.patch('/:id', requireAuth, validate(habitIdSchema, 'params'), validate(updateHabitSchema), habitController.updateHabit);
router.delete('/:id', requireAuth, validate(habitIdSchema, 'params'), habitController.deleteHabit);
router.post('/:id/completions', requireAuth, validate(habitIdSchema, 'params'), validate(createCompletionSchema), habitController.createCompletion);
router.delete('/:id/completions', requireAuth, validate(habitIdSchema, 'params'), validate(completionDateQuerySchema, 'query'), habitController.deleteCompletion);
router.get('/:id/completions', requireAuth, validate(habitIdSchema, 'params'), validate(completionRangeQuerySchema, 'query'), habitController.getCompletions);

export default router;
