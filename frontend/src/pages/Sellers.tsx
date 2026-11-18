import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { Award, Medal, UserRound } from 'lucide-react';
import { Card, DataState, PageHeader } from '../components/ui';
import { SortableTable, type Column } from '../components/SortableTable';
import { ChartTooltip } from '../components/ChartTooltip';
import { useFilteredFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import type { VendedorRanking } from '../types';
import { formatCOP, formatCOPCompact, formatDate, formatNumber, formatPercent } from '../utils/format';

const PODIO = [
  { ring: 'ring-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', label: '1.er lugar' },
  { ring: 'ring-slate-400', bg: 'bg-slate-50', text: 'text-slate-500', label: '2.º lugar' },
  { ring: 'ring-orange-400', bg: 'bg-orange-50', text: 'text-orange-600', label: '3.er lugar' },
];

const COLUMNAS: Column<VendedorRanking>[] = [
  { key: 'posicion', label: '#', align: 'center' },
  { key: 'nombre', label: 'Vendedor', className: 'whitespace-nowrap', render: (r) => <span className="font-medium">{r.nombre}</span> },
  { key: 'ciudad_asignada', label: 'Ciudad asignada', className: 'whitespace-nowrap' },
  { key: 'ingresos', label: 'Ingresos', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.ingresos) },
  { key: 'num_ventas', label: 'Ventas', align: 'right' },
  { key: 'ticket_promedio', label: 'Ticket prom.', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.ticket_promedio) },
  { key: 'utilidad', label: 'Utilidad', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.utilidad) },
  { key: 'margen', label: 'Margen', align: 'right', className: 'whitespace-nowrap', sortValue: (r) => r.margen ?? 0, render: (r) => formatPercent(r.margen) },
  { key: 'participacion', label: 'Particip.', align: 'right', className: 'whitespace-nowrap', sortValue: (r) => r.participacion ?? 0, render: (r) => formatPercent(r.participacion) },
  { key: 'fecha_contratacion', label: 'Contratación', className: 'whitespace-nowrap', render: (r) => formatDate(r.fecha_contratacion) },
];

const corto = (n: string) => { const p = n.split(' '); return `${p[0]} ${p[p.length - 1]}`; };

export default function Sellers() {
  const vendedores = useFilteredFetch(api.vendedores);

  return (
    <>
      <PageHeader icon={<UserRound className="h-5 w-5" />} title="Análisis de vendedores"
        description="Facturación total, productividad por transacción y utilidad generada por cada vendedor." />

      <DataState state={vendedores} isEmpty={(d) => d.length === 0} height="h-32">
        {(d) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {d.slice(0, 3).map((v, i) => (
              <article key={v.id_vendedor} className={`card animate-fade-up p-5 ring-2 ${PODIO[i].ring}`} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between">
                  <span className={`badge ${PODIO[i].bg} ${PODIO[i].text}`}>{PODIO[i].label}</span>
                  {i === 0 ? <Award className={`h-6 w-6 ${PODIO[i].text}`} /> : <Medal className={`h-6 w-6 ${PODIO[i].text}`} />}
                </div>
                <p className="mt-3 text-lg font-bold text-ink">{v.nombre}</p>
                <p className="text-xs text-muted">{v.ciudad_asignada}</p>
                <p className="mt-3 text-2xl font-bold text-primary">{formatCOP(v.ingresos)}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div><dt className="text-muted">Ventas</dt><dd className="font-semibold">{formatNumber(v.num_ventas)}</dd></div>
                  <div><dt className="text-muted">Ticket</dt><dd className="font-semibold">{formatCOPCompact(v.ticket_promedio)}</dd></div>
                  <div><dt className="text-muted">Utilidad</dt><dd className="font-semibold text-success">{formatCOPCompact(v.utilidad)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </DataState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Ingresos y utilidad por vendedor">
          <DataState state={vendedores} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={d.map((v) => ({ ...v, corto: corto(v.nombre) }))} margin={{ left: 10, right: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="corto" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatCOPCompact} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utilidad" name="Utilidad" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
        <Card title="Productividad: ventas vs ticket promedio" subtitle="Tamaño de la burbuja = ingresos totales">
          <DataState state={vendedores} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ left: 10, right: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" dataKey="num_ventas" name="Ventas" tick={{ fontSize: 11 }} label={{ value: 'Número de ventas', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis type="number" dataKey="ticket_promedio" name="Ticket" tickFormatter={formatCOPCompact} tick={{ fontSize: 11 }} width={80} />
                  <ZAxis type="number" dataKey="ingresos" range={[80, 900]} />
                  <Tooltip content={({ active, payload }) => {
                    const v = payload?.[0]?.payload as VendedorRanking | undefined;
                    return active && v ? (
                      <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold">{v.nombre}</p>
                        <p>Ventas: {v.num_ventas}</p><p>Ticket: {formatCOP(v.ticket_promedio)}</p><p>Ingresos: {formatCOP(v.ingresos)}</p>
                      </div>) : null;
                  }} />
                  <Scatter data={d} fill="#2563EB" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
      </div>

      <Card title="Ranking completo de vendedores" subtitle="Ordenable por cualquier columna">
        <DataState state={vendedores} isEmpty={(d) => d.length === 0}>
          {(d) => <SortableTable rows={d} columns={COLUMNAS} rowKey={(r) => r.id_vendedor} initialSort={{ key: 'ingresos', dir: 'desc' }}
            searchKeys={(r) => `${r.nombre} ${r.ciudad_asignada}`} searchPlaceholder="Buscar vendedor o ciudad…" />}
        </DataState>
      </Card>
    </>
  );
}
