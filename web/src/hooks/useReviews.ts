import { useMemo } from 'react';
import useSWR from 'swr';
import { apiFetch } from '../api';
import type { PaginatedResponse, Review } from '../types';

const fetcher = (url: string) => apiFetch<PaginatedResponse<Review>>(url);

export function useReviews(
  titleId: number | undefined,
  page: number,
  excludeUserId?: number
) {
  const query = useMemo(() => {
    const params = [`page=${page}`];
    if (titleId) params.push(`titleId=${titleId}`);
    if (excludeUserId) params.push(`excludeUserId=${excludeUserId}`);
    return `/reviews?${params.join('&')}`;
  }, [titleId, page, excludeUserId]);

  const { data, error, mutate, isLoading } = useSWR<PaginatedResponse<Review>>(
    query,
    fetcher,
    {
      keepPreviousData: true,
    }
  );

  return {
    reviews: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.page ?? page,
    error,
    mutate,
    isLoading,
  };
}
