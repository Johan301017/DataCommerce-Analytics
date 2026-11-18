import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

type Accent = 'blue' | 'green' | 'navy' | 'amber' | 'violet';

const ACCENTS: Record<Accent, string> = {
  blue: 'bg-primary-light text-primary',
  green: 'bg-success-light text-success',
  navy: 'bg-slate-200 text-navy',
  amber: 'bg-amber-100 text-amber-600',
  violet: 'bg-violet-100 text-violet-600',
};

export function KpiCard({ label, value, icon, hint, trend, accent = 'blue', delay = 0 }: {
  label: string; value: string; icon: ReactNode; hint?: string; trend?: number | null; accent?: Accent; delay?: number;
}) {
  const trendColor = trend === null || trend === undefined ? 'text-muted' : trend > 0 ? 'text-success' : trend < 0 ? 'text-red-500' : 'text-muted';
  const TrendIcon = trend === null || trend === undefined || trend === 0 ? Minus : trend > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <article className="card animate-fade-up p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 whitespace-nowrap text-base font-bold text-ink sm:text-lg 2xl:text-xl" title={value}>{value}</p>
        </div>
        <div className={`shrink-0 rounded-lg p-2 ${ACCENTS[accent]}`} aria-hidden>{icon}</div>
      </div>
      {(hint || trend !== undefined) && (
        <p className={`mt-2 flex items-center gap-1 text-xs ${trendColor}`}>
          {trend !== undefined && <TrendIcon className="h-3.5 w-3.5" aria-hidden />}
          <span className={trend !== undefined ? '' : 'text-muted'}>{hint}</span>
        </p>
      )}
    </article>
  );
}
