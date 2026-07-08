export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn('daily_logs', {
    emotion: { type: 'varchar(20)' },
    intensity: { type: 'integer' },
    duration: { type: 'integer' },
    fid_score: { type: 'integer' }
  });
};

export const down = (pgm) => {
  pgm.dropColumn('daily_logs', 'fid_score');
  pgm.dropColumn('daily_logs', 'emotion');
  pgm.dropColumn('daily_logs', 'intensity');
  pgm.dropColumn('daily_logs', 'duration');
};