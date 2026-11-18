import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import type { FetchState } from '../hooks/useFetch';

export function Card({ title, subtitle, actions, children, className = '', bodyClassName = 'p-5' }: {
  title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string;
}) {
  return (
    <section className={`card animate-fade-up ${className}`}>
      {(title || actions) && (
        <header className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function LoadingState({ label = 'Cargando datos desde MySQL…', height = 'h-48' }: { label?: string; height?: string }) {
  return (
    <div role="status" className={`flex ${height} flex-col items-center justify-center gap-2 text-muted`}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-100">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No hay datos para los filtros seleccionados.' }: { message?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted">
      <Inbox className="h-6 w-6" aria-hidden />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/** Gestiona los estados de carga, error y ausencia de datos. */
export function DataState<T>({ state, isEmpty, children, height }: {
  state: FetchState<T>; isEmpty?: (d: T) => boolean; children: (d: T) => ReactNode; height?: string;
}) {
  if (state.loading && state.data === undefined) return <LoadingState height={height} />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.retry} />;
  if (state.data === undefined) return <LoadingState height={height} />;
  if (isEmpty?.(state.data)) return <EmptyState />;
  return <div className={state.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>{children(state.data)}</div>;
}

export function PageHeader({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary-light p-2 text-primary">{icon}</div>
      <div>
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}
