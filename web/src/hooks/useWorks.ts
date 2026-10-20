import { useMemo } from 'react';
import useSWR from 'swr';
import { apiFetch } from '../api';
import type { PaginatedResponse, WorkListItem } from '../types';

const fetcher = (url: string) => apiFetch<PaginatedResponse<WorkListItem>>(url);

export function useWorks(
  typeFilter: string,
  searchQuery: string,
  page: number
) {
  const worksQuery = useMemo(() => {
    const params = [`page=${page}`];

    if (typeFilter !== 'all') {
      params.push(`type=${encodeURIComponent(typeFilter)}`);
    }

    if (searchQuery) {
      params.push(`q=${encodeURIComponent(searchQuery)}`);
    }

    return `/works${params.length ? `?${params.join('&')}` : ''}`;
  }, [typeFilter, searchQuery, page]);

  const { data, error, mutate, isLoading } = useSWR<
    PaginatedResponse<WorkListItem>
  >(worksQuery, fetcher, {
    keepPreviousData: true,
  });

  return {
    works: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.page ?? page,
    error,
    mutate,
    isLoading,
  };
}
