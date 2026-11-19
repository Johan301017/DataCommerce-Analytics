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

/** Valida en cliente si el rango de fechas está invertido para evitar peticiones HTTP 422 innecesarias. */
export function fechasInvalidas(f: Filtros): boolean {
  return Boolean(f.fecha_inicio && f.fecha_fin && f.fecha_inicio > f.fecha_fin);
}

/** Atajo: petición que depende de los filtros globales. */
export function useFilteredFetch<T>(loader: (f: Filtros, signal: AbortSignal) => Promise<T>): FetchState<T> {
  const { filtros } = useFilters();
  return useFetch((signal) => {
    if (fechasInvalidas(filtros)) {
      return Promise.reject(new Error('La fecha inicial no puede ser posterior a la fecha final.'));
    }
    return loader(filtros, signal);
  }, [filtros]);
}
