export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('habit_completions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    habit_id: {
      type: 'uuid',
      notNull: true,
      references: 'habits',
      onDelete: 'cascade'
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'cascade'
    },
    completed_at: { type: 'date', notNull: true },
    note: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createIndex('habit_completions', ['user_id', 'completed_at'], { unique: false, ifNotExists: true, name: 'habit_completions_user_id_completed_at_idx' });
  pgm.createIndex('habit_completions', ['user_id', 'habit_id', 'completed_at'], { unique: true, ifNotExists: true, name: 'habit_completions_user_habit_date_uq' });
};

export const down = (pgm) => {
  pgm.dropIndex('habit_completions', ['user_id', 'habit_id', 'completed_at'], { ifExists: true, name: 'habit_completions_user_habit_date_uq' });
  pgm.dropIndex('habit_completions', ['user_id', 'completed_at'], { ifExists: true, name: 'habit_completions_user_id_completed_at_idx' });
  pgm.dropTable('habit_completions');
};
