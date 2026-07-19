export const shorthands = undefined;

export const up = (pgm) => {
  pgm.dropColumn('daily_logs', 'mood_score');
  pgm.dropColumn('daily_logs', 'emotion_label');
};

export const down = (pgm) => {
  pgm.addColumn('daily_logs', {
    mood_score: { type: 'integer', check: 'mood_score >= 0 AND mood_score <= 5' },
    emotion_label: { type: 'varchar(50)' }
  });
};