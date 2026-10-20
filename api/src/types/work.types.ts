export const WORK_TYPES = ['movie', 'game', 'book'] as const;
export type WorkType = (typeof WORK_TYPES)[number];
