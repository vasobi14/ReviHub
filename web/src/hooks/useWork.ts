import useSWR from 'swr';
import { apiFetch } from '../api';
import type { Work } from '../types';

export function useWork(id: number | null) {
  const {
    data: work,
    error,
    mutate,
  } = useSWR<Work>(id ? `/works/${id}` : null, apiFetch);

  return {
    data: work,
    error,
    mutate,
  };
}
