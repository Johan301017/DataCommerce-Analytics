import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { Catalogos, Filtros } from '../types';

export const FILTROS_VACIOS: Filtros = { fecha_inicio: '', fecha_fin: '', ciudad_id: '', vendedor_id: '', categoria_id: '' };

interface FiltersContextValue {
  filtros: Filtros;
  setFiltro: (campo: keyof Filtros, valor: string) => void;
  limpiar: () => void;
  catalogos: Catalogos | null;
  catalogosError: string | null;
  activos: number;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [catalogosError, setCatalogosError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    api.catalogos(ctrl.signal)
      .then(setCatalogos)
      .catch((e: Error) => { if (e.name !== 'AbortError') setCatalogosError(e.message); });
    return () => ctrl.abort();
  }, []);

  const setFiltro = useCallback((campo: keyof Filtros, valor: string) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }, []);
  const limpiar = useCallback(() => setFiltros(FILTROS_VACIOS), []);
  const activos = Object.values(filtros).filter(Boolean).length;

  const value = useMemo(
    () => ({ filtros, setFiltro, limpiar, catalogos, catalogosError, activos }),
    [filtros, setFiltro, limpiar, catalogos, catalogosError, activos],
  );
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters debe usarse dentro de FiltersProvider');
  return ctx;
}
