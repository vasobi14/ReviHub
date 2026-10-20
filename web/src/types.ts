// src/types.ts
export interface User {
  id: number;
  email: string;
  name: string | null;
}

export interface Review {
  id: number;
  workId: number;
  userId: number;
  score: number;
  text: string | null;
  createdAt: string;
  user: { id: number; name: string | null };
}

export type WorkType = 'movie' | 'game' | 'book';

export interface Work {
  id: number;
  title: string;
  type: WorkType;
  releaseYear: number | null;
  description: string | null;
  reviews: Review[];
  createdById: number;
  imageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
}

export interface WorkListItem extends Omit<Work, 'reviews'> {
  latestReviews: Review[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
