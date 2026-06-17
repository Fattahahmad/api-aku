import Joi from 'joi';

const dateSchema = Joi.string().isoDate().messages({
  'string.empty': 'Tanggal tidak boleh kosong',
  'string.isoDate': 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD',
  'any.required': 'Tanggal wajib diisi'
});

export const createHabitSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Judul habit tidak boleh kosong',
    'string.min': 'Judul habit minimal 1 karakter',
    'string.max': 'Judul habit maksimal 100 karakter',
    'any.required': 'Judul habit wajib diisi'
  }),
  description: Joi.string().trim().allow('').max(500).optional().messages({
    'string.max': 'Deskripsi maksimal 500 karakter'
  }),
  targetDate: Joi.string().isoDate().optional().messages({
    'string.isoDate': 'Format targetDate tidak valid. Gunakan format YYYY-MM-DD'
  })
});

export const updateHabitSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'Judul habit tidak boleh kosong',
    'string.min': 'Judul habit minimal 1 karakter',
    'string.max': 'Judul habit maksimal 100 karakter'
  }),
  description: Joi.string().trim().allow('').max(500).optional().messages({
    'string.max': 'Deskripsi maksimal 500 karakter'
  }),
  targetDate: Joi.string().isoDate().allow(null).optional().messages({
    'string.isoDate': 'Format targetDate tidak valid. Gunakan format YYYY-MM-DD'
  })
});

export const habitIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID habit tidak valid',
    'any.required': 'ID habit wajib diisi'
  })
});

export const createCompletionSchema = Joi.object({
  date: dateSchema,
  note: Joi.string().trim().allow('').max(500).optional().messages({
    'string.max': 'Note maksimal 500 karakter'
  })
});

export const completionDateQuerySchema = Joi.object({
  date: dateSchema.required()
});

export const completionRangeQuerySchema = Joi.object({
  from: dateSchema.required(),
  to: dateSchema.required()
}).custom((value, helpers) => {
  if (value.from > value.to) {
    return helpers.error('range.invalid');
  }
  return value;
}).messages({
  'range.invalid': 'Parameter from tidak boleh lebih besar dari to'
});
