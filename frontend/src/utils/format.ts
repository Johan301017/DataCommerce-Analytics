const cop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
const num = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

/** $ 1.250.000 COP */
export function formatCOP(value: number | null | undefined, sufijo = true): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `$ ${cop.format(Math.round(value))}${sufijo ? ' COP' : ''}`;
}

/** Formato compacto para ejes: $ 1,2 M */
export function formatCOPCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$ ${dec1.format(value / 1e9)} MM`;
  if (abs >= 1e6) return `$ ${dec1.format(value / 1e6)} M`;
  if (abs >= 1e3) return `$ ${num.format(value / 1e3)} mil`;
  return `$ ${num.format(value)}`;
}

/** 25,3 % */
export function formatPercent(value: number | null | undefined, decimales = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: decimales, minimumFractionDigits: decimales }).format(value)} %`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return num.format(value);
}

/** AAAA-MM-DD -> DD/MM/AAAA (sin conversión de zona horaria) */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#84CC16', '#64748B', '#0F172A'];
