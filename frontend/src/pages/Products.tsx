import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Package, Trophy } from 'lucide-react';
import { Card, DataState, PageHeader } from '../components/ui';
import { SortableTable, type Column } from '../components/SortableTable';
import { ChartTooltip } from '../components/ChartTooltip';
import { useFilteredFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import type { CategoriaRentabilidad, ProductoRanking } from '../types';
import { COLORS, formatCOP, formatCOPCompact, formatNumber, formatPercent } from '../utils/format';

const COL_CATEGORIAS: Column<CategoriaRentabilidad>[] = [
  { key: 'rank_utilidad', label: 'Rank util.', align: 'center' },
  { key: 'categoria', label: 'Categoría', render: (r) => <span className="font-medium">{r.categoria}</span> },
  { key: 'ingresos_netos', label: 'Ingresos netos', align: 'right', render: (r) => formatCOP(r.ingresos_netos) },
  { key: 'costos', label: 'Costos', align: 'right', render: (r) => formatCOP(r.costos) },
  { key: 'utilidad', label: 'Utilidad', align: 'right', render: (r) => <span className="font-semibold text-success">{formatCOP(r.utilidad)}</span> },
  { key: 'margen', label: 'Margen', align: 'right', sortValue: (r) => r.margen ?? 0, render: (r) => formatPercent(r.margen) },
  { key: 'participacion', label: 'Participación', align: 'right', sortValue: (r) => r.participacion ?? 0, render: (r) => formatPercent(r.participacion, 2) },
  { key: 'rank_facturacion', label: 'Rank fact.', align: 'center' },
];

const COL_PRODUCTOS: Column<ProductoRanking>[] = [
  { key: 'posicion', label: '#', align: 'center' },
  { key: 'sku', label: 'SKU', className: 'whitespace-nowrap' },
  { key: 'nombre', label: 'Producto', render: (r) => (
    <span className="font-medium">{r.nombre}{!r.activo && <span className="badge ml-2 bg-slate-200 text-slate-600">Descontinuado</span>}</span>) },
  { key: 'categoria', label: 'Categoría', className: 'whitespace-nowrap' },
  { key: 'unidades', label: 'Unidades', align: 'right' },
  { key: 'ingresos', label: 'Ingresos', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.ingresos) },
  { key: 'utilidad', label: 'Utilidad', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.utilidad) },
  { key: 'margen', label: 'Margen', align: 'right', className: 'whitespace-nowrap', sortValue: (r) => r.margen ?? 0, render: (r) => (
    <span className={(r.margen ?? 0) < 15 ? 'font-semibold text-red-600' : ''}>{formatPercent(r.margen)}</span>) },
  { key: 'supera_promedio', label: '> Promedio', align: 'center', sortValue: (r) => (r.supera_promedio ? 1 : 0), render: (r) => (
    r.supera_promedio ? <span className="badge bg-success-light text-success">Sí</span> : <span className="badge bg-slate-100 text-muted">No</span>) },
];

export default function Products() {
  const categorias = useFilteredFetch(api.categorias);
  const productos = useFilteredFetch(api.productos);

  return (
    <>
      <PageHeader icon={<Package className="h-5 w-5" />} title="Productos y categorías"
        description="Rentabilidad por categoría y desempeño de productos con precios y costos históricos." />

      <DataState state={categorias} isEmpty={(d) => d.length === 0} height="h-24">
        {(d) => {
          const util = d.find((c) => c.rank_utilidad === 1)!;
          const fact = d.find((c) => c.rank_facturacion === 1)!;
          const marg = [...d].sort((a, b) => (b.margen ?? 0) - (a.margen ?? 0))[0];
          const items = [
            { t: 'Mayor utilidad absoluta', c: util, v: formatCOP(util.utilidad) },
            { t: 'Mayor facturación', c: fact, v: formatCOP(fact.ingresos_netos) },
            { t: 'Mayor margen', c: marg, v: formatPercent(marg.margen) },
          ];
          return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {items.map((it) => (
                <div key={it.t} className="card animate-fade-up flex items-center gap-3 p-4">
                  <div className="rounded-lg bg-success-light p-2 text-success"><Trophy className="h-5 w-5" /></div>
                  <div><p className="text-xs uppercase text-muted">{it.t}</p><p className="font-bold">{it.c.categoria}</p><p className="text-sm text-muted">{it.v}</p></div>
                </div>
              ))}
            </div>
          );
        }}
      </DataState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Participación de categorías" subtitle="% de ingresos netos totales">
          <DataState state={categorias} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={d} dataKey="ingresos_netos" nameKey="categoria" innerRadius={52} outerRadius={84} paddingAngle={2}
                    label={({ payload }) => formatPercent((payload as CategoriaRentabilidad).participacion)} labelLine={false}>
                    {d.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
        <Card title="Ingresos, costos y utilidad" className="xl:col-span-2">
          <DataState state={categorias} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={d} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="categoria" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatCOPCompact} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar dataKey="ingresos_netos" name="Ingresos" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costos" name="Costos" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utilidad" name="Utilidad" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Margen por categoría" subtitle="Utilidad / ingresos netos">
          <DataState state={categorias} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...d].sort((a, b) => (b.margen ?? 0) - (a.margen ?? 0))} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" unit=" %" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="categoria" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip kind="percent" />} />
                  <Bar dataKey="margen" name="Margen" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
        <Card title="Productos más vendidos (unidades)" subtitle="Top 10">
          <DataState state={productos} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...d].sort((a, b) => b.unidades - a.unidades).slice(0, 10)} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nombre" width={190} tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip kind="number" />} />
                  <Bar dataKey="unidades" name="Unidades" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
      </div>

      <Card title="Productos con mayores ingresos" subtitle="Top 10 por ingresos netos">
        <DataState state={productos} isEmpty={(d) => d.length === 0}>
          {(d) => (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={d.slice(0, 10)} margin={{ left: 10, right: 10, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="sku" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatCOPCompact} tick={{ fontSize: 11 }} width={80} />
                <Tooltip content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as ProductoRanking | undefined;
                  return active && p ? (
                    <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
                      <p className="font-semibold">{p.nombre}</p><p>Ingresos: {formatCOP(p.ingresos)}</p>
                      <p>Unidades: {formatNumber(p.unidades)}</p><p>Margen: {formatPercent(p.margen)}</p>
                    </div>) : null;
                }} />
                <Bar dataKey="ingresos" name="Ingresos" radius={[4, 4, 0, 0]}>
                  {d.slice(0, 10).map((p, i) => <Cell key={i} fill={(p.margen ?? 0) < 15 ? '#F59E0B' : '#2563EB'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </DataState>
        <p className="mt-2 text-xs text-muted">Barras en ámbar: productos con margen inferior al 15 %.</p>
      </Card>

      <Card title="Rentabilidad por categoría" subtitle="Rank util. = posición por utilidad · Rank fact. = posición por facturación">
        <DataState state={categorias} isEmpty={(d) => d.length === 0}>
          {(d) => <SortableTable rows={d} columns={COL_CATEGORIAS} rowKey={(r) => r.id_categoria} initialSort={{ key: 'utilidad', dir: 'desc' }} maxHeight="" />}
        </DataState>
      </Card>

      <Card title="Ranking de productos">
        <DataState state={productos} isEmpty={(d) => d.length === 0}>
          {(d) => <SortableTable rows={d} columns={COL_PRODUCTOS} rowKey={(r) => r.id_producto} initialSort={{ key: 'ingresos', dir: 'desc' }}
            searchKeys={(r) => `${r.nombre} ${r.sku} ${r.categoria}`} searchPlaceholder="Buscar producto, SKU o categoría…" />}
        </DataState>
      </Card>
    </>
  );
}
