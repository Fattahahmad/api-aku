export const shorthands = undefined;

export const up = (pgm) => {
  // Add week_number column as nullable first
  pgm.addColumn('weekly_insights', {
    week_number: { type: 'varchar(20)', nullable: true }
  });

  // Update existing rows with computed week_number based on start_date
  pgm.sql(`
    UPDATE weekly_insights
    SET week_number = to_char(start_date + INTERVAL '7 hours', 'IYYY-IW')
  `);

  // Now set column to not null
  pgm.alterColumn('weekly_insights', 'week_number', {
    notNull: true
  });

  // Create unique index on user_id and week_number
  pgm.createIndex('weekly_insights', 'user_id, week_number', { unique: true, name: 'weekly_insights_user_week_unique' });
};

export const down = (pgm) => {
  pgm.dropIndex('weekly_insights', 'user_id, week_number', { name: 'weekly_insights_user_week_unique' });
  pgm.dropColumn('weekly_insights', 'week_number');
};