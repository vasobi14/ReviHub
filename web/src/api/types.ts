export type Role = 'USER' | 'ADMIN' | 'DEMO';

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: Role;
}

export interface AdminUser extends User {
  emailVerified: boolean;
  createdAt: string;
  _count: { titles: number; reviews: number };
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

export type TitleSort = 'new' | 'year' | 'popular' | 'rating';

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

export interface ActivityEntry {
  id: number;
  createdAt: string;
  method: string;
  path: string;
  route: string | null;
  status: number;
  durationMs: number;
  userId: number | null;
  userAgent: string | null;
  ip: string | null;
  titleName: string | null;
}

interface Totals {
  requests: number;
  visitors: number;
  users: number;
}

export interface AnalyticsSummary {
  enabled: boolean;
  day: Totals;
  week: Totals;
  topTitles: { id: number; name: string; views: number }[];
}

export interface ActivityPage {
  entries: ActivityEntry[];
  // Pass as ?before= to get the next, older page; null on the last one
  nextCursor: number | null;
}

export interface UserSummary {
  enabled: boolean;
  user: {
    id: number;
    email: string;
    name: string | null;
    role: Role;
    createdAt: string;
  };
  lastSeen: string | null;
  requests: number;
}
