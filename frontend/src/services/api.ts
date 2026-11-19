import type {
  AnalisisEjecutivo, Catalogos, CategoriaRentabilidad, CiudadRendimiento, ClienteRecurrente, ConsultaSql,
  Filtros, Kpis, PremiumResponse, ProductoRanking, VendedorRanking, VentaMensual,
} from '../types';

// En desarrollo Vite redirige /api al backend (ver vite.config.ts).
// En otros despliegues puede definirse VITE_API_URL, p. ej. http://localhost:8000
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

function query(filtros?: Partial<Filtros>, extra?: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  Object.entries({ ...(filtros ?? {}), ...(extra ?? {}) }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, { signal, headers: { Accept: 'application/json' } });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError('No fue posible conectar con la API. Verifique que el backend esté en ejecución.');
  }
  if (!res.ok) {
    let detalle = `Error ${res.status}`;
    try {
      const body = await res.json();
      detalle = typeof body.detail === 'string' ? body.detail : detalle;
    } catch { /* respuesta sin JSON */ }
    throw new ApiError(detalle, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: (s?: AbortSignal) => get<{ status: string; database: string }>('/health', s),
  catalogos: (s?: AbortSignal) => get<Catalogos>('/catalogos/filtros', s),
  kpis: (f: Filtros, s?: AbortSignal) => get<Kpis>(`/dashboard/kpis${query(f)}`, s),
  ventasMensuales: (f: Filtros, s?: AbortSignal) => get<VentaMensual[]>(`/dashboard/ventas-mensuales${query(f)}`, s),
  ciudades: (f: Filtros, s?: AbortSignal) => get<CiudadRendimiento[]>(`/ciudades/rendimiento${query(f)}`, s),
  vendedores: (f: Filtros, s?: AbortSignal) => get<VendedorRanking[]>(`/vendedores/ranking${query(f)}`, s),
  categorias: (f: Filtros, s?: AbortSignal) => get<CategoriaRentabilidad[]>(`/categorias/rentabilidad${query(f)}`, s),
  productos: (f: Filtros, s?: AbortSignal) => get<ProductoRanking[]>(`/productos/ranking${query(f)}`, s),
  recurrentes: (f: Filtros, s?: AbortSignal) => get<ClienteRecurrente[]>(`/clientes/recurrentes${query(f)}`, s),
  premium: (f: Filtros, s?: AbortSignal, fechaCorte?: string) => get<PremiumResponse>(`/clientes/premium${query(f, fechaCorte ? { fecha_corte: fechaCorte } : undefined)}`, s),
  analisis: (f: Filtros, s?: AbortSignal) => get<AnalisisEjecutivo>(`/analisis/ejecutivo${query(f)}`, s),
  consultas: (s?: AbortSignal) => get<ConsultaSql[]>('/consultas', s),
  consulta: (n: number, s?: AbortSignal) => get<ConsultaSql>(`/consultas/${n}`, s),
};
