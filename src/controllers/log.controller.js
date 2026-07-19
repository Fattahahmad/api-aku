// src/controllers/log.controller.js
import * as logModel from '../models/log.model.js';
import * as userModel from '../models/user.model.js';
import * as geminiService from '../services/gemini.service.js';
import InvariantError from '../exceptions/InvariantError.js';
import NotFoundError from '../exceptions/NotFoundError.js';

import pool from '../config/database.js';

export const createLog = async (req, res, next) => {
  let client;
  try {
    const userId = req.user.id;
    const { emotion, intensity, journal_text } = req.body;

    client = await pool.connect();
    await client.query('BEGIN');

    const newLog = await logModel.createDailyLog(userId, emotion, intensity, journal_text, client);
    const streakResult = await userModel.updateUserStreak(userId, client);

    const suggestion = await geminiService.generateDailySuggestion(emotion, intensity, journal_text, userId);

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: 'Jurnal harian berhasil disimpan!',
      data: { 
        log: newLog,
        suggestion,
        streak: streakResult.current_streak
      },
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    
    if (error.code === '23505') {
      return next(new InvariantError('Anda sudah melakukan check-in hari ini. Silakan edit log yang tersedia jika ingin mengubah data.'));
    }
    next(error);
  } finally {
    if (client) client.release();
  }
};

export const getTodayStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const log = await logModel.checkLogToday(userId);

    res.status(200).json({
      status: 'success',
      data: {
        has_checked_in: !!log,
        log_data: log || null
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCalendarLogs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    if (!month || !year) {
      throw new InvariantError('Parameter bulan (month) dan tahun (year) wajib diisi. Contoh: ?month=5&year=2026');
    }

    const logs = await logModel.getMonthlyLogs(userId, month, year);

    res.status(200).json({
      status: 'success',
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
};

export const getLogDetail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.params; 

    const log = await logModel.getLogByDate(userId, date);

    if (!log) {
      return res.status(200).json({
        status: 'success',
        data: { log: null }
      });
    }

    res.status(200).json({
      status: 'success',
      data: { log },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLog = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { emotion, intensity, journal_text } = req.body;

    const updatedLog = await logModel.updateDailyLogWithOwnership(id, userId, emotion, intensity, journal_text);
    
    if (!updatedLog) {
      throw new NotFoundError('Log jurnal tidak ditemukan atau bukan milik Anda.');
    }

    const logDateUTC = new Date(updatedLog.created_at);
    const logDateWIB = new Date(logDateUTC.getTime() + (7 * 60 * 60 * 1000));
    const logDateStr = logDateWIB.toISOString().split('T')[0];

    const now = new Date();
    const todayWIB = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const todayStr = todayWIB.toISOString().split('T')[0];

    if (logDateStr !== todayStr) {
      throw new InvariantError('Akses ditolak. Jurnal hari-hari sebelumnya tidak dapat diubah.');
    }

    res.status(200).json({
      status: 'success',
      message: 'Jurnal harian berhasil diperbarui!',
      data: { log: updatedLog },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLog = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deletedLog = await logModel.deleteDailyLogWithOwnership(id, userId);
    
    if (!deletedLog) {
      throw new NotFoundError('Log jurnal tidak ditemukan atau bukan milik Anda.');
    }

    const logDateUTC = new Date(deletedLog.created_at);
    const logDateWIB = new Date(logDateUTC.getTime() + (7 * 60 * 60 * 1000));
    const logDateStr = logDateWIB.toISOString().split('T')[0];
    
    const now = new Date();
    const todayWIB = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const todayStr = todayWIB.toISOString().split('T')[0];
    
    if (logDateStr !== todayStr) {
      throw new InvariantError('Akses ditolak. Jurnal hari-hari sebelumnya tidak dapat dihapus.');
    }

    res.status(200).json({
      status: 'success',
      message: 'Jurnal harian berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLogs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    const offset = (page - 1) * limit;

    const [logs, totalItems] = await Promise.all([
      logModel.getJournalHistory(userId, month, year, limit, offset),
      logModel.countJournalHistory(userId, month, year)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          total_items: totalItems,
          total_pages: totalPages,
          current_page: page,
          limit: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};