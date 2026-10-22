export const TITLE_TYPES = ['movie', 'game', 'book'] as const;
export type TitleType = (typeof TITLE_TYPES)[number];
