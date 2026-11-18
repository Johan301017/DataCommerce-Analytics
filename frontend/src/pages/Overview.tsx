import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Boxes, CircleDollarSign, LayoutDashboard, Percent, Receipt, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { Card, DataState, PageHeader } from '../components/ui';
import { ChartTooltip } from '../components/ChartTooltip';
import { useFilteredFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import { COLORS, formatCOP, formatCOPCompact, formatDate, formatNumber, formatPercent } from '../utils/format';

export default function Overview() {
  const kpis = useFilteredFetch(api.kpis);
  const mensual = useFilteredFetch(api.ventasMensuales);
  const categorias = useFilteredFetch(api.categorias);
  const ciudades = useFilteredFetch(api.ciudades);
  const vendedores = useFilteredFetch(api.vendedores);

  return (
    <>
      <PageHeader icon={<LayoutDashboard className="h-5 w-5" />} title="Vista general"
        description="Indicadores estratégicos calculados en MySQL para el periodo y los filtros seleccionados." />

      <DataState state={kpis} height="h-32">
        {(k) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Ingresos totales" value={formatCOP(k.ingresos_totales)} icon={<CircleDollarSign className="h-5 w-5" />} hint="Ingresos netos de descuentos" />
            <KpiCard label="Utilidad total" value={formatCOP(k.utilidad_total)} icon={<Wallet className="h-5 w-5" />} accent="green" hint={`Costos: ${formatCOP(k.costos_totales)}`} delay={40} />
            <KpiCard label="Margen de utilidad" value={formatPercent(k.margen_utilidad)} icon={<Percent className="h-5 w-5" />} accent="violet" hint="Utilidad / ingresos netos" delay={80} />
            <KpiCard label="Transacciones" value={formatNumber(k.total_transacciones)} icon={<Receipt className="h-5 w-5" />} accent="navy" hint="Facturas distintas" delay={120} />
            <KpiCard label="Ticket promedio" value={formatCOP(k.ticket_promedio)} icon={<ShoppingCart className="h-5 w-5" />} hint="Ingresos / transacciones" delay={160} />
            <KpiCard label="Clientes" value={formatNumber(k.total_clientes)} icon={<Users className="h-5 w-5" />} accent="amber" hint="Clientes con compras en el periodo" delay={200} />
            <KpiCard label="Unidades vendidas" value={formatNumber(k.productos_vendidos_unidades)} icon={<Boxes className="h-5 w-5" />} accent="navy" hint="Suma de cantidades" delay={240} />
            <KpiCard label="Crecimiento" value={k.crecimiento_periodo === null ? 'N/D' : formatPercent(k.crecimiento_periodo)}
              icon={<TrendingUp className="h-5 w-5" />} accent="green" trend={k.crecimiento_periodo}
              hint={k.periodos.actual && k.periodos.anterior
                ? `${formatDate(k.periodos.actual.inicio)}–${formatDate(k.periodos.actual.fin)} vs ${formatDate(k.periodos.anterior.inicio)}–${formatDate(k.periodos.anterior.fin)}`
                : 'Sin periodo comparable'} delay={280} />
          </div>
        )}
      </DataState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Ingresos y utilidad mensual" subtitle="Agrupado por año y mes (YEAR, MONTH)" className="xl:col-span-2">
          <DataState state={mensual} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={d} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tickFormatter={formatCOPCompact} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Line dataKey="utilidad" name="Utilidad" stroke="#10B981" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
        <Card title="Ventas por categoría" subtitle="Participación en ingresos netos">
          <DataState state={categorias} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={d} dataKey="ingresos_netos" nameKey="categoria" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {d.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Ranking de ciudades" subtitle="Ciudad donde ocurrió la venta">
          <DataState state={ciudades} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={Math.max(220, d.length * 38)}>
                <BarChart data={d} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatCOPCompact} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="ciudad" width={95} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
        <Card title="Ranking de vendedores" subtitle="Ingresos generados por vendedor">
          <DataState state={vendedores} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ResponsiveContainer width="100%" height={Math.max(220, d.length * 34)}>
                <BarChart data={d.map((v) => ({ ...v, corto: v.nombre.split(' ').slice(0, 1).concat(v.nombre.split(' ').slice(-1)).join(' ') }))} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatCOPCompact} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="corto" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#0F172A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </DataState>
        </Card>
      </div>

      <Card title="Comparación de ingresos, costos y utilidad por categoría" subtitle="Ingresos netos = cantidad × (precio − descuento)">
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
    </>
  );
}
