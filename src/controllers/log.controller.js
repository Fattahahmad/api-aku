// src/controllers/log.controller.js
import * as logModel from '../models/log.model.js';
import InvariantError from '../exceptions/InvariantError.js';
import NotFoundError from '../exceptions/NotFoundError.js';

export const createLog = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { mood_score, journal_text } = req.body;
    const existingLog = await logModel.checkLogToday(userId);
    if (existingLog) {
      throw new InvariantError('Anda sudah melakukan check-in hari ini. Silakan edit log yang tersedia jika ingin mengubah data.');
    }

    const newLog = await logModel.createDailyLog(userId, mood_score, journal_text);

    res.status(201).json({
      status: 'success',
      message: 'Jurnal harian berhasil disimpan!',
      data: { log: newLog },
    });
  } catch (error) {
    next(error);
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
    const today = new Date();
    const month = req.query.month || (today.getMonth() + 1); 
    const year = req.query.year || today.getFullYear();

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
    const { mood_score, journal_text } = req.body;
    const log = await logModel.getLogById(id);
    if (!log || log.user_id !== userId) {
      throw new NotFoundError('Log jurnal tidak ditemukan.');
    }

    const logDate = new Date(log.created_at).toDateString();
    const today = new Date().toDateString();
    
    if (logDate !== today) {
      throw new InvariantError('Akses ditolak. Jurnal hari-hari sebelumnya tidak dapat diubah.');
    }

    const updatedLog = await logModel.updateDailyLog(id, mood_score, journal_text);

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

    const log = await logModel.getLogById(id);
    if (!log || log.user_id !== userId) {
      throw new NotFoundError('Log jurnal tidak ditemukan.');
    }

    const logDate = new Date(log.created_at).toDateString();
    const today = new Date().toDateString();
    
    if (logDate !== today) {
      throw new InvariantError('Akses ditolak. Jurnal hari-hari sebelumnya tidak dapat dihapus.');
    }

    await logModel.deleteDailyLog(id);

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