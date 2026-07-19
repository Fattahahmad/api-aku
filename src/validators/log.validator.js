import Joi from 'joi';

const FID_EMOTIONS = ['Joy', 'Sadness', 'Trust', 'Disgust', 'Fear', 'Anger', 'Surprise', 'Anticipation'];

export const createLogSchema = Joi.object({
  emotion: Joi.string().valid(...FID_EMOTIONS).required().messages({
    'any.only': 'Emosi harus salah satu dari: ' + FID_EMOTIONS.join(', '),
    'any.required': 'Emosi wajib diisi'
  }),
  intensity: Joi.number().integer().min(1).max(10).required().messages({
    'number.min': 'Intensitas minimal adalah 1',
    'number.max': 'Intensitas maksimal adalah 10',
    'any.required': 'Intensitas wajib diisi'
  }),
  journal_text: Joi.string().allow('').optional()
});