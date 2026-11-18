import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Brain, CheckCircle2, Eye, Lightbulb } from 'lucide-react';
import { Card, DataState, EmptyState, PageHeader } from '../components/ui';
import { useFilteredFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import type { CrecimientoCiudad } from '../types';
import { formatCOP, formatNumber, formatPercent } from '../utils/format';

function fmtValor(valor: number, unidad: string) {
  if (unidad === '%') return formatPercent(valor);
  if (unidad === 'productos') return `${formatNumber(valor)} productos`;
  return valor.toLocaleString('es-CO', { maximumFractionDigits: 3 });
}

export default function Intelligence() {
  const analisis = useFilteredFetch(api.analisis);

  return (
    <>
      <PageHeader icon={<Brain className="h-5 w-5" />} title="Inteligencia comercial"
        description="Hallazgos calculados a partir de las consultas SQL. Se separan las métricas observadas de las interpretaciones." />

      <DataState state={analisis}>
        {(a) => a.sin_datos ? <Card><EmptyState message="No hay ventas en el periodo seleccionado; no es posible generar hallazgos." /></Card> : (
          <div className="space-y-6">
            <Card title={<span className="inline-flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Métricas observadas</span>}
              subtitle="Valores obtenidos directamente de MySQL para los filtros activos">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {a.hallazgos.map((h) => (
                  <div key={h.titulo} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{h.titulo}</p>
                    <p className="mt-1 font-bold text-ink">{h.valor}</p>
                    <p className="mt-1 text-xs text-muted">{h.detalle}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card title="Crecimiento por ciudad" subtitle={`Periodos comparables: ${a.kpis.periodos.criterio}`}>
                {a.crecimiento_ciudades && a.crecimiento_ciudades.some((c) => c.crecimiento !== null) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={a.crecimiento_ciudades.filter((c) => c.crecimiento !== null)} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis type="number" unit=" %" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="ciudad" width={100} tick={{ fontSize: 12 }} />
                      <ReferenceLine x={a.kpis.crecimiento_periodo ?? 0} stroke="#0F172A" strokeDasharray="4 4" label={{ value: 'Total', fontSize: 10, position: 'top' }} />
                      <Tooltip content={({ active, payload }) => {
                        const c = payload?.[0]?.payload as CrecimientoCiudad | undefined;
                        return active && c ? (
                          <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
                            <p className="font-semibold">{c.ciudad}</p><p>Crecimiento: {formatPercent(c.crecimiento)}</p>
                            <p>Actual: {formatCOP(c.ingresos_actual)}</p><p>Anterior: {formatCOP(c.ingresos_anterior)}</p>
                          </div>) : null;
                      }} />
                      <Bar dataKey="crecimiento" name="Crecimiento" radius={[0, 4, 4, 0]}>
                        {a.crecimiento_ciudades.filter((c) => c.crecimiento !== null).map((c) => <Cell key={c.ciudad} fill={(c.crecimiento ?? 0) >= 0 ? '#10B981' : '#EF4444'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState message="No hay un periodo anterior con ventas para comparar." />}
              </Card>

              <Card title="Concentración de ventas" subtitle="HHI: índice Herfindahl-Hirschman (0–10.000; >2.500 = alta concentración)">
                {a.concentracion && (
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Top 3 vendedores', formatPercent(a.concentracion.top3_vendedores_pct)],
                      ['Ciudad líder', formatPercent(a.concentracion.ciudad_lider_pct)],
                      ['Categoría líder', formatPercent(a.concentracion.categoria_lider_pct)],
                      ['Tasa de recompra', formatPercent(a.concentracion.tasa_recompra_pct)],
                      ['HHI ciudades', formatNumber(a.concentracion.hhi_ciudades)],
                      ['HHI categorías', formatNumber(a.concentracion.hhi_categorias)],
                      ['HHI vendedores', formatNumber(a.concentracion.hhi_vendedores)],
                      ['Coef. variación mensual', a.concentracion.coeficiente_variacion_mensual.toLocaleString('es-CO')],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-muted">{k}</dt><dd className="text-lg font-bold">{v}</dd></div>
                    ))}
                  </dl>
                )}
              </Card>
            </div>

            <Card title={<span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Evaluación de riesgos</span>}
              subtitle="Cada riesgo se declara solo si la métrica supera su umbral explícito">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {a.riesgos.map((r) => (
                  <div key={r.riesgo} className={`rounded-lg border p-4 ${r.detectado ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{r.riesgo}</p>
                      {r.detectado
                        ? <span className="badge bg-amber-200 text-amber-800">Detectado</span>
                        : <span className="badge bg-success-light text-success"><CheckCircle2 className="mr-1 h-3 w-3" /> No respaldado</span>}
                    </div>
                    <p className="mt-2 text-xs text-muted">{r.metrica}</p>
                    <p className="text-sm"><b>{fmtValor(r.valor, r.unidad)}</b> <span className="text-muted">(umbral {fmtValor(r.umbral, r.unidad)})</span></p>
                    <p className="mt-1 text-xs text-muted">{r.evidencia}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={<span className="inline-flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Interpretaciones y recomendaciones</span>}
              subtitle="Juicios analíticos derivados de las métricas; no son datos observados">
              <ul className="space-y-2">
                {a.recomendaciones.map((r) => (
                  <li key={r} className="flex gap-2 rounded-lg bg-primary-light/40 p-3 text-sm"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{r}</li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </DataState>
    </>
  );
}
