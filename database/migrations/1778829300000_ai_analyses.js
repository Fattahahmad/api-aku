export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('ai_analyses', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    log_id: { 
      type: 'uuid', 
      notNull: false, 
      references: 'daily_logs', 
      onDelete: 'cascade' 
    },
    user_id: { 
      type: 'uuid', 
      notNull: true, 
      references: 'users', 
      onDelete: 'cascade' 
    },
    input_type: { type: 'varchar(20)', notNull: true }, // 'daily' atau 'weekly'
    emotion: { type: 'varchar(50)' },
    confidence: { type: 'numeric(5, 4)' },
    raw_response: { type: 'jsonb' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  
  pgm.createIndex('ai_analyses', 'user_id');
  pgm.createIndex('ai_analyses', 'log_id');
};

export const down = (pgm) => {
  pgm.dropTable('ai_analyses');
};