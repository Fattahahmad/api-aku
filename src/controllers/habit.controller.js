import * as habitModel from '../models/habit.model.js';
import NotFoundError from '../exceptions/NotFoundError.js';
import InvariantError from '../exceptions/InvariantError.js';

import { getWIBDate, addDays } from '../utils/date.util.js';

const calculateStreak = (completedDates) => {
  const today = getWIBDate();
  const dateSet = new Set(completedDates);
  let streak = 0;
  let cursor = today;

  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

const calculateCompletionRate = (totalCompleted, activeHabits, fromDate, toDate) => {
  const startDate = new Date(`${fromDate}T00:00:00+07:00`);
  const endDate = new Date(`${toDate}T00:00:00+07:00`);
  const totalDays = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
  const possibleCompletions = activeHabits * totalDays;

  if (possibleCompletions === 0) return 0;
  return Math.round((totalCompleted / possibleCompletions) * 100);
};

const getBestStreak = async (userId, fromDate, toDate) => {
  const rows = await habitModel.getBestStreakInRange(userId, fromDate, toDate);
  const grouped = rows.reduce((acc, row) => {
    if (!acc.has(row.id)) {
      acc.set(row.id, {
        habitId: row.id,
        title: row.title,
        completedDates: new Set()
      });
    }

    if (row.completed_at) {
      acc.get(row.id).completedDates.add(row.completed_at);
    }

    return acc;
  }, new Map());

  let best = {
    habitId: null,
    title: null,
    streak: 0
  };

  for (const habit of grouped.values()) {
    const streak = calculateStreak(Array.from(habit.completedDates));
    if (streak > best.streak) {
      best = {
        habitId: habit.habitId,
        title: habit.title,
        streak
      };
    }
  }

  return best;
};

export const getHabits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const habits = await habitModel.getHabits(userId);

    res.status(200).json({
      status: 'success',
      data: { habits }
    });
  } catch (error) {
    next(error);
  }
};

export const getHabitById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const habit = await habitModel.getHabitById(userId, id);

    if (!habit) {
      throw new NotFoundError('Habit tidak ditemukan');
    }

    res.status(200).json({
      status: 'success',
      data: { habit }
    });
  } catch (error) {
    next(error);
  }
};

export const createHabit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, targetDate } = req.body;
    const habit = await habitModel.createHabit(userId, title, description || null, targetDate || null);

    res.status(201).json({
      status: 'success',
      message: 'Habit berhasil dibuat',
      data: { habit }
    });
  } catch (error) {
    next(error);
  }
};

export const updateHabit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, targetDate } = req.body;
    const habit = await habitModel.updateHabit(userId, id, title, description, targetDate === null ? null : targetDate);

    if (!habit) {
      throw new NotFoundError('Habit tidak ditemukan');
    }

    res.status(200).json({
      status: 'success',
      message: 'Habit berhasil diperbarui',
      data: { habit }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHabit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const rowCount = await habitModel.deleteHabit(userId, id);

    if (rowCount === 0) {
      throw new NotFoundError('Habit tidak ditemukan');
    }

    res.status(200).json({
      status: 'success',
      message: 'Habit berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};

export const createCompletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date, note } = req.body;
    const habit = await habitModel.getHabitById(userId, id);

    if (!habit) {
      throw new NotFoundError('Habit tidak ditemukan');
    }

    const completion = await habitModel.createCompletion(userId, id, date, note || null);

    if (!completion) {
      throw new InvariantError('Habit pada tanggal ini sudah ditandai selesai.');
    }

    const completedDates = (await habitModel.getCompletionsByRange(userId, id, '1970-01-01', getWIBDate()))
      .map((item) => item.completed_at);

    res.status(201).json({
      status: 'success',
      message: 'Habit berhasil ditandai selesai',
      data: { completion, streak: calculateStreak(completedDates) }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date } = req.query;
    const rowCount = await habitModel.deleteCompletion(userId, id, date);

    if (rowCount === 0) {
      throw new NotFoundError('Completion tidak ditemukan');
    }

    const completedDates = (await habitModel.getCompletionsByRange(userId, id, '1970-01-01', getWIBDate()))
      .map((item) => item.completed_at);

    res.status(200).json({
      status: 'success',
      message: 'Completion berhasil dihapus',
      data: { streak: calculateStreak(completedDates) }
    });
  } catch (error) {
    next(error);
  }
};

export const getCompletions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { from, to } = req.query;
    const habit = await habitModel.getHabitById(userId, id);

    if (!habit) {
      throw new NotFoundError('Habit tidak ditemukan');
    }

    const completions = await habitModel.getCompletionsByRange(userId, id, from, to);

    res.status(200).json({
      status: 'success',
      data: { completions }
    });
  } catch (error) {
    next(error);
  }
};

export const getHabitSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;
    const [activeHabits, totalCompleted, dailyCompletions, bestStreak] = await Promise.all([
      habitModel.getActiveHabitsCount(userId),
      habitModel.getTotalCompletionsByRange(userId, from, to),
      habitModel.getDailyCompletionsByRange(userId, from, to),
      getBestStreak(userId, from, to)
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        activeHabits,
        totalCompleted,
        completionRate: calculateCompletionRate(totalCompleted, activeHabits, from, to),
        bestStreak,
        dailyCompletions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getHabitInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;
    const rows = await habitModel.getHabitsWithDatesInRange(userId, from, to);
    const grouped = rows.reduce((acc, row) => {
      if (!acc.has(row.id)) {
        acc.set(row.id, {
          habitId: row.id,
          title: row.title,
          completedDates: new Set()
        });
      }

      if (row.completed_at) {
        acc.get(row.id).completedDates.add(row.completed_at);
      }

      return acc;
    }, new Map());

    const insights = Array.from(grouped.values()).map((habit) => {
      const completedDates = Array.from(habit.completedDates);
      return {
        habitId: habit.habitId,
        title: habit.title,
        completedDays: completedDates.length,
        streak: calculateStreak(completedDates),
        completionRate: calculateCompletionRate(completedDates.length, 1, from, to)
      };
    });

    res.status(200).json({
      status: 'success',
      data: { insights }
    });
  } catch (error) {
    next(error);
  }
};
