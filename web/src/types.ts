export interface User {
  id: number;
  email: string;
  name: string | null;
}

export interface Review {
  id: number;
  titleId: number;
  userId: number;
  score: number;
  text: string | null;
  createdAt: string;
  user: { id: number; name: string | null };
}

export type TitleType = 'movie' | 'game' | 'book';

export type TitleSort = 'new' | 'popular' | 'rating';

export interface Title {
  id: number;
  name: string;
  type: TitleType;
  releaseYear: number | null;
  description: string | null;
  reviews: Review[];
  createdById: number;
  imageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
}

export type TitleListItem = Omit<Title, 'reviews'>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
