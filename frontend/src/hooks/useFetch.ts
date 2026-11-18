import { useEffect, useState, type DependencyList } from 'react';
import { useFilters } from '../context/FiltersContext';
import type { Filtros } from '../types';

export interface FetchState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/** Ejecuta una petición cancelable y vuelve a ejecutarla cuando cambian las dependencias. */
export function useFetch<T>(loader: (signal: AbortSignal) => Promise<T>, deps: DependencyList): FetchState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    loader(ctrl.signal)
      .then((d) => { setData(d); setLoading(false); })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return;
        setError(e.message || 'Error desconocido');
        setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intento]);

  return { data, loading, error, retry: () => setIntento((i) => i + 1) };
}

/** Atajo: petición que depende de los filtros globales. */
export function useFilteredFetch<T>(loader: (f: Filtros, signal: AbortSignal) => Promise<T>): FetchState<T> {
  const { filtros } = useFilters();
  return useFetch((signal) => loader(filtros, signal), [filtros]);
}
