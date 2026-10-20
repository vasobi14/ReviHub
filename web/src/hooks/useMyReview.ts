import useSWR from 'swr';
import { apiFetch } from '../api';
import type { Review } from '../types';

export function useMyReview(workId: number | null, enabled: boolean) {
  const key = enabled && workId ? `/reviews/mine?workId=${workId}` : null;
  const { data, error, isLoading, mutate } = useSWR<Review | null>(
    key,
    apiFetch
  );

  return { data, error, isLoading, mutate };
}
