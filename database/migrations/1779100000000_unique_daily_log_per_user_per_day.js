export const shorthands = undefined;

export const up = (pgm) => {
  // Remove duplicate rows, keeping the most recent log per user per WIB date
  const sql = `
    DELETE FROM daily_logs d
    USING (
      SELECT user_id,
             DATE(created_at + INTERVAL '7 hours') AS wib_date,
             MAX(created_at) AS max_created_at
      FROM daily_logs
      GROUP BY user_id, DATE(created_at + INTERVAL '7 hours')
      HAVING COUNT(*) > 1
    ) dup
    WHERE d.user_id = dup.user_id
      AND DATE(d.created_at + INTERVAL '7 hours') = dup.wib_date
      AND d.created_at < dup.max_created_at;
  `;
  pgm.sql(sql);
  // Now create unique index
  pgm.createIndex('daily_logs', 'user_id, DATE(created_at + INTERVAL \'7 hours\')', { unique: true, name: 'daily_logs_user_id_wib_date_unique' });
};

export const down = (pgm) => {
  pgm.dropIndex('daily_logs', 'user_id, DATE(created_at + INTERVAL \'7 hours\')', { ifExists: true, name: 'daily_logs_user_id_wib_date_unique' });
};