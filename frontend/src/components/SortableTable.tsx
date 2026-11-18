import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
  className?: string;
}

/** Tabla ordenable con búsqueda opcional. */
export function SortableTable<T>({ rows, columns, initialSort, searchKeys, searchPlaceholder = 'Buscar…', maxHeight = 'max-h-[420px]', rowKey, extraFilters }: {
  rows: T[]; columns: Column<T>[]; initialSort?: { key: string; dir: 'asc' | 'desc' };
  searchKeys?: (row: T) => string; searchPlaceholder?: string; maxHeight?: string; rowKey: (row: T) => string | number;
  extraFilters?: ReactNode;
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [term, setTerm] = useState('');

  const data = useMemo(() => {
    let out = rows;
    if (searchKeys && term.trim()) {
      const t = term.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      out = out.filter((r) => searchKeys(r).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(t));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const val = (r: T) => (col?.sortValue ? col.sortValue(r) : ((r as Record<string, unknown>)[sort.key] as number | string));
      out = [...out].sort((a, b) => {
        const va = val(a); const vb = val(b);
        const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es');
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, columns, sort, term, searchKeys]);

  const toggle = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));

  return (
    <div>
      {(searchKeys || extraFilters) && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          {searchKeys && (
            <label className="relative block flex-1">
              <span className="sr-only">Buscar</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" aria-hidden />
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={searchPlaceholder} className="input pl-9" />
            </label>
          )}
          {extraFilters}
        </div>
      )}
      <div className={`overflow-auto rounded-lg border border-slate-200 ${maxHeight}`}>
        <table className="table-base">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}>
                  <button type="button" onClick={() => toggle(c.key)} className={`inline-flex items-center gap-1 uppercase hover:text-ink ${c.align === 'right' ? 'flex-row-reverse' : ''}`}>
                    {c.label}
                    {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="py-8 text-center text-muted">Sin resultados</td></tr>
            ) : data.map((r) => (
              <tr key={rowKey(r)}>
                {columns.map((c) => (
                  <td key={c.key} className={`${c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : ''} ${c.className ?? ''}`}>
                    {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{data.length} de {rows.length} registros</p>
    </div>
  );
}
