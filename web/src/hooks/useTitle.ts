import useSWR from 'swr';
import { apiFetch } from '../api/client';
import type { Title } from '../api/types';

export function useTitle(id: number | null) {
  const {
    data: title,
    error,
    mutate,
  } = useSWR<Title>(id ? `/titles/${id}` : null, apiFetch);

  return {
    data: title,
    error,
    mutate,
  };
}
