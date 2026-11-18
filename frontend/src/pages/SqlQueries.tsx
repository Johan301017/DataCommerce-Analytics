import { useState } from 'react';
import { Database, Play } from 'lucide-react';
import { Card, DataState, PageHeader } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import { formatNumber } from '../utils/format';

function celda(col: string, v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') {
    const monetaria = /ingreso|costo|utilidad|ticket|promedio|monetario/.test(col) && !/porcentual|margen|percentil/.test(col);
    return monetaria ? `$ ${v.toLocaleString('es-CO', { maximumFractionDigits: 2 })}` : v.toLocaleString('es-CO', { maximumFractionDigits: 4 });
  }
  return String(v);
}

/** Ejecuta en vivo el SQL literal del archivo database/03_consultas_analiticas.sql. */
export default function SqlQueries() {
  const lista = useFetch((s) => api.consultas(s), []);
  const [numero, setNumero] = useState(1);
  const resultado = useFetch((s) => api.consulta(numero, s), [numero]);

  return (
    <>
      <PageHeader icon={<Database className="h-5 w-5" />} title="Consultas SQL"
        description="SQL literal del script 03_consultas_analiticas.sql ejecutado en vivo contra MySQL (sin filtros del dashboard)." />

      <DataState state={lista} height="h-16">
        {(l) => (
          <div className="flex flex-wrap gap-2" role="tablist">
            {l.map((c) => (
              <button key={c.numero} role="tab" aria-selected={numero === c.numero} onClick={() => setNumero(c.numero)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${numero === c.numero ? 'bg-primary text-white shadow' : 'bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                {c.numero === 10 ? '10 · Premium' : `Consulta ${c.numero}`}
              </button>
            ))}
          </div>
        )}
      </DataState>

      <DataState state={resultado}>
        {(r) => (
          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
            <Card title={r.titulo} subtitle={r.descripcion}>
              <pre className="max-h-[520px] overflow-auto rounded-lg bg-navy p-4 text-xs leading-relaxed text-slate-100"><code>{r.sql}</code></pre>
            </Card>
            <Card title={<span className="inline-flex items-center gap-2"><Play className="h-4 w-4 text-success" /> Resultado de MySQL</span>}
              subtitle={`${formatNumber(r.filas?.length ?? 0)} filas${r.numero === 10 ? ` · fecha de corte ${r.fecha_corte}` : ''}`}>
              <div className="max-h-[520px] overflow-auto rounded-lg border border-slate-200">
                <table className="table-base">
                  <thead><tr>{r.columnas?.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                  <tbody>
                    {r.filas?.map((f, i) => (
                      <tr key={i}>{r.columnas?.map((c) => <td key={c} className={typeof f[c] === 'number' ? 'text-right tabular-nums' : ''}>{celda(c, f[c])}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </DataState>
    </>
  );
}
