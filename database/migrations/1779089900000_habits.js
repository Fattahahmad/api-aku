export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('habits', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'cascade'
    },
    title: { type: 'varchar(100)', notNull: true },
    description: { type: 'text' },
    target_date: { type: 'date' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createIndex('habits', ['user_id', 'created_at'], { unique: false, ifNotExists: true, name: 'habits_user_id_created_at_idx' });
};

export const down = (pgm) => {
  pgm.dropIndex('habits', ['user_id', 'created_at'], { ifExists: true, name: 'habits_user_id_created_at_idx' });
  pgm.dropTable('habits');
};
