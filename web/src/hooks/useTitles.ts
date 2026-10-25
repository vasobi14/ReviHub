import { useMemo } from 'react';
import useSWR from 'swr';
import { apiFetch } from '../api/client';
import type { PaginatedResponse, TitleListItem, TitleSort } from '../api/types';

const fetcher = (url: string) =>
  apiFetch<PaginatedResponse<TitleListItem>>(url);

export function useTitles(
  typeFilter: string,
  searchQuery: string,
  page: number,
  sort: TitleSort,
) {
  const titlesQuery = useMemo(() => {
    const params = [`page=${page}`, `sort=${sort}`];

    if (typeFilter !== 'all') {
      params.push(`type=${encodeURIComponent(typeFilter)}`);
    }

    if (searchQuery) {
      params.push(`q=${encodeURIComponent(searchQuery)}`);
    }

    return `/titles${params.length ? `?${params.join('&')}` : ''}`;
  }, [typeFilter, searchQuery, page, sort]);

  const { data, error, mutate, isLoading } = useSWR<
    PaginatedResponse<TitleListItem>
  >(titlesQuery, fetcher, {
    keepPreviousData: true,
  });

  return {
    titles: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.page ?? page,
    error,
    mutate,
    isLoading,
  };
}
