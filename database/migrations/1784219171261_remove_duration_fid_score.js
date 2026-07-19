export const shorthands = undefined;

export const up = (pgm) => {
  pgm.dropColumn('daily_logs', 'duration');
  pgm.dropColumn('daily_logs', 'fid_score');
};

export const down = (pgm) => {
  pgm.addColumn('daily_logs', {
    duration: { type: 'integer' },
    fid_score: { type: 'integer' }
  });
};