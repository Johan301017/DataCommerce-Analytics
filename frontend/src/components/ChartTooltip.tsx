import { formatCOP, formatNumber, formatPercent } from '../utils/format';

interface Payload { name?: string; value?: number; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }

/** Tooltip de Recharts con formato colombiano. */
export function ChartTooltip({ active, payload, label, kind = 'cop' }: {
  active?: boolean; payload?: Payload[]; label?: string | number; kind?: 'cop' | 'number' | 'percent';
}) {
  if (!active || !payload?.length) return null;
  const fmt = (v?: number) => (kind === 'cop' ? formatCOP(v) : kind === 'percent' ? formatPercent(v) : formatNumber(v));
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-semibold text-ink">{label}</p>}
      {payload.map((p) => (
        <p key={String(p.dataKey ?? p.name)} className="flex items-center gap-2 text-muted">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-medium text-ink">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}
