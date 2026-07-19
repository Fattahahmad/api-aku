export const shorthands = undefined;

export const up = (pgm) => {
  pgm.renameColumn('weekly_insights', 'average_mood_score', 'average_intensity');
};

export const down = (pgm) => {
  pgm.renameColumn('weekly_insights', 'average_intensity', 'average_mood_score');
};