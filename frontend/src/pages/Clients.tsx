import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { Check, Crown, Repeat, Sparkles, Users, X } from 'lucide-react';
import { Card, DataState, PageHeader } from '../components/ui';
import { SortableTable, type Column } from '../components/SortableTable';
import { ChartTooltip } from '../components/ChartTooltip';
import { useFilteredFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import type { ClienteRecurrente, ClienteRfm, Segmento } from '../types';
import { formatCOP, formatCOPCompact, formatDate, formatNumber, formatPercent } from '../utils/format';

const SEG_COLOR: Record<Segmento, string> = { Premium: '#10B981', 'Potencial premium': '#2563EB', Regular: '#94A3B8' };
const SEG_BADGE: Record<Segmento, string> = {
  Premium: 'bg-success-light text-success', 'Potencial premium': 'bg-primary-light text-primary', Regular: 'bg-slate-100 text-muted',
};

const Criterio = ({ ok }: { ok: boolean }) => ok
  ? <Check className="mx-auto h-4 w-4 text-success" aria-label="Cumple" />
  : <X className="mx-auto h-4 w-4 text-slate-300" aria-label="No cumple" />;

const COL_RFM: Column<ClienteRfm>[] = [
  { key: 'nombre', label: 'Cliente', render: (r) => <div><p className="font-medium">{r.nombre}</p><p className="text-xs text-muted">Doc. {r.documento}</p></div> },
  { key: 'ciudad', label: 'Ciudad', className: 'whitespace-nowrap' },
  { key: 'num_compras', label: 'Compras (F)', align: 'right' },
  { key: 'ingresos', label: 'Gasto (M)', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.ingresos) },
  { key: 'ticket_promedio', label: 'Ticket prom.', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.ticket_promedio) },
  { key: 'ultima_compra', label: 'Última compra', className: 'whitespace-nowrap', render: (r) => formatDate(r.ultima_compra) },
  { key: 'dias_desde_ultima', label: 'Días (R)', align: 'right' },
  { key: 'percentil_gasto', label: 'Percentil M', align: 'right', render: (r) => `${r.percentil_gasto.toFixed(1)}` },
  { key: 'cumple_frecuencia', label: 'F≥3', align: 'center', sortValue: (r) => Number(r.cumple_frecuencia), render: (r) => <Criterio ok={r.cumple_frecuencia} /> },
  { key: 'cumple_recencia', label: 'R≤180', align: 'center', sortValue: (r) => Number(r.cumple_recencia), render: (r) => <Criterio ok={r.cumple_recencia} /> },
  { key: 'cumple_monetario', label: 'Top 25 %', align: 'center', sortValue: (r) => Number(r.cumple_monetario), render: (r) => <Criterio ok={r.cumple_monetario} /> },
  { key: 'segmento', label: 'Segmento', className: 'whitespace-nowrap', sortValue: (r) => r.criterios_cumplidos, render: (r) => <span className={`badge ${SEG_BADGE[r.segmento]}`}>{r.segmento}</span> },
];

const COL_REC: Column<ClienteRecurrente>[] = [
  { key: 'nombre', label: 'Cliente', render: (r) => <span className="font-medium">{r.nombre}</span> },
  { key: 'ciudad', label: 'Ciudad', className: 'whitespace-nowrap' },
  { key: 'num_compras', label: 'Compras', align: 'right' },
  { key: 'ingresos', label: 'Ingresos', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.ingresos) },
  { key: 'ticket_promedio', label: 'Ticket prom.', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.ticket_promedio) },
  { key: 'primera_compra', label: 'Primera', className: 'whitespace-nowrap', render: (r) => formatDate(r.primera_compra) },
  { key: 'ultima_compra', label: 'Última', className: 'whitespace-nowrap', render: (r) => formatDate(r.ultima_compra) },
];

export default function Clients() {
  const premium = useFilteredFetch(api.premium);
  const recurrentes = useFilteredFetch(api.recurrentes);
  const [segmento, setSegmento] = useState<'' | Segmento>('');

  return (
    <>
      <PageHeader icon={<Users className="h-5 w-5" />} title="Clientes"
        description="Recompra, ranking por gasto y segmentación premium inspirada en RFM (Recencia, Frecuencia, Valor monetario)." />

      <DataState state={premium} height="h-32">
        {(p) => (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {p.resumen.map((s, i) => (
                <article key={s.segmento} className="card animate-fade-up p-4" style={{ animationDelay: `${i * 50}ms`, borderTop: `4px solid ${SEG_COLOR[s.segmento]}` }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{s.segmento}</p>
                    {s.segmento === 'Premium' ? <Crown className="h-5 w-5 text-success" /> : s.segmento === 'Potencial premium' ? <Sparkles className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-muted" />}
                  </div>
                  <p className="mt-2 text-2xl font-bold">{s.clientes} <span className="text-sm font-normal text-muted">clientes</span></p>
                  <p className="text-xs text-muted">{formatCOP(s.ingresos)} · {formatPercent(s.participacion_ingresos)} de los ingresos</p>
                  <p className="text-xs text-muted">Ticket promedio: {formatCOP(s.ticket_promedio)}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary-light/40 p-4 text-sm text-ink">
              <p className="font-semibold">Criterios de segmentación (fecha de corte {formatDate(p.fecha_corte)})</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
                <li><b>Frecuencia:</b> al menos {p.criterios.frecuencia_minima} compras (facturas distintas).</li>
                <li><b>Recencia:</b> última compra dentro de los {p.criterios.recencia_maxima_dias} días anteriores al corte.</li>
                <li><b>Valor monetario:</b> gasto acumulado en el 25 % superior (PERCENT_RANK ≥ 0,75).</li>
                <li>{p.criterios.regla}.</li>
              </ul>
            </div>
          </>
        )}
      </DataState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Distribución de segmentos" subtitle="Número de clientes">
          <DataState state={premium} isEmpty={(d) => d.clientes.length === 0}>
            {(p) => (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={p.resumen} dataKey="clientes" nameKey="segmento" innerRadius={60} outerRadius={100} paddingAngle={2} label={({ value }) => value}>
                    {p.resumen.map((s) => <Cell key={s.segmento} fill={SEG_COLOR[s.segmento]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip kind="number" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
        <Card title="Recencia vs frecuencia" subtitle="Tamaño = gasto acumulado · color = segmento" className="xl:col-span-2">
          <DataState state={premium} isEmpty={(d) => d.clientes.length === 0}>
            {(p) => (
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ left: 10, right: 20, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" dataKey="dias_desde_ultima" name="Días" tick={{ fontSize: 11 }} label={{ value: 'Días desde la última compra (R)', position: 'insideBottom', offset: -8, fontSize: 11 }} />
                  <YAxis type="number" dataKey="num_compras" name="Compras" tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: 'Compras (F)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <ZAxis type="number" dataKey="ingresos" range={[60, 700]} />
                  <Tooltip content={({ active, payload }) => {
                    const c = payload?.[0]?.payload as ClienteRfm | undefined;
                    return active && c ? (
                      <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold">{c.nombre}</p><p>{c.segmento}</p>
                        <p>Compras: {c.num_compras} · Días: {c.dias_desde_ultima}</p><p>Gasto: {formatCOP(c.ingresos)}</p>
                      </div>) : null;
                  }} />
                  {(['Premium', 'Potencial premium', 'Regular'] as Segmento[]).map((s) => (
                    <Scatter key={s} name={s} data={p.clientes.filter((c) => c.segmento === s)} fill={SEG_COLOR[s]} fillOpacity={0.7} />
                  ))}
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12 }} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
      </div>

      <Card title="Ranking de clientes por gasto" subtitle="Top 10">
        <DataState state={premium} isEmpty={(d) => d.clientes.length === 0}>
          {(p) => {
            const top = [...p.clientes].sort((a, b) => b.ingresos - a.ingresos).slice(0, 10).map((c) => ({ ...c, corto: c.nombre.split(' ').slice(0, 2).join(' ') }));
            return (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top} margin={{ left: 10, right: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="corto" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatCOPCompact} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="ingresos" name="Gasto acumulado" radius={[4, 4, 0, 0]}>
                    {top.map((c) => <Cell key={c.id_cliente} fill={SEG_COLOR[c.segmento]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          }}
        </DataState>
      </Card>

      <Card title="Segmentación de clientes (consulta 10)" subtitle="Tabla con búsqueda y filtro por segmento">
        <DataState state={premium} isEmpty={(d) => d.clientes.length === 0}>
          {(p) => (
            <SortableTable
              rows={segmento ? p.clientes.filter((c) => c.segmento === segmento) : p.clientes}
              columns={COL_RFM} rowKey={(r) => r.id_cliente} initialSort={{ key: 'segmento', dir: 'desc' }}
              searchKeys={(r) => `${r.nombre} ${r.ciudad} ${r.documento}`} searchPlaceholder="Buscar cliente, ciudad o documento…"
              extraFilters={(
                <select className="input sm:w-56" value={segmento} onChange={(e) => setSegmento(e.target.value as '' | Segmento)} aria-label="Filtrar por segmento">
                  <option value="">Todos los segmentos</option>
                  <option value="Premium">Premium</option>
                  <option value="Potencial premium">Potencial premium</option>
                  <option value="Regular">Regular</option>
                </select>
              )} />
          )}
        </DataState>
      </Card>

      <Card title={<span className="inline-flex items-center gap-2"><Repeat className="h-4 w-4 text-primary" /> Clientes con compras repetidas (consulta 7)</span>}
        subtitle="Clientes con más de una factura en el periodo filtrado">
        <DataState state={recurrentes} isEmpty={(d) => d.length === 0}>
          {(d) => <SortableTable rows={d} columns={COL_REC} rowKey={(r) => r.id_cliente} initialSort={{ key: 'num_compras', dir: 'desc' }}
            searchKeys={(r) => `${r.nombre} ${r.ciudad}`} searchPlaceholder="Buscar cliente o ciudad…" />}
        </DataState>
        <DataState state={recurrentes}>{(d) => <p className="mt-1 text-xs text-muted">{formatNumber(d.length)} clientes recurrentes.</p>}</DataState>
      </Card>
    </>
  );
}
