import useSWRInfinite from 'swr/infinite';
import { apiFetch } from '../api/client';
import type { ActivityPage } from '../api/types';

const fetcher = (url: string) => apiFetch<ActivityPage>(url);

// Pages of the request feed, newest first; each next page starts where the
// previous one ended
export function useActivityFeed(
  userId: number | undefined,
  technical: boolean,
) {
  const getKey = (_index: number, previous: ActivityPage | null) => {
    if (previous && previous.nextCursor === null) return null;
    const params = new URLSearchParams();
    if (userId) params.set('userId', String(userId));
    if (technical) params.set('technical', 'true');
    if (previous) params.set('before', String(previous.nextCursor));
    const query = params.toString();
    return `/admin/analytics/feed${query ? `?${query}` : ''}`;
  };

  const { data, error, isLoading, size, setSize } =
    useSWRInfinite<ActivityPage>(getKey, fetcher);

  return {
    entries: data?.flatMap((page) => page.entries) ?? [],
    hasMore: data !== undefined && data.at(-1)?.nextCursor !== null,
    isLoading,
    isLoadingMore: data !== undefined && data.length < size,
    error,
    loadMore: () => setSize(size + 1),
  };
}
