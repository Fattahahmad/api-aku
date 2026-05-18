import Joi from 'joi';

export const createLogSchema = Joi.object({
  mood_score: Joi.number().integer().min(0).max(5).required().messages({
    'number.min': 'Skor mood minimal adalah 0',
    'number.max': 'Skor mood maksimal adalah 5',
    'any.required': 'Skor mood wajib diisi'
  }),
  journal_text: Joi.string().allow('', null).optional()
});