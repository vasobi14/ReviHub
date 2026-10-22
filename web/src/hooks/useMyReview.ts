import useSWR from 'swr';
import { apiFetch } from '../api';
import type { Review } from '../types';

export function useMyReview(titleId: number | null, enabled: boolean) {
  const key = enabled && titleId ? `/reviews/mine?titleId=${titleId}` : null;
  const { data, error, isLoading, mutate } = useSWR<Review | null>(
    key,
    apiFetch
  );

  return { data, error, isLoading, mutate };
}
