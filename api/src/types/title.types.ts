export const TITLE_TYPES = ['movie', 'game', 'book'] as const;
export type TitleType = (typeof TITLE_TYPES)[number];

export const TITLE_SORTS = ['new', 'popular', 'rating'] as const;
export type TitleSort = (typeof TITLE_SORTS)[number];
