import { useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip as LTooltip } from 'react-leaflet';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MapPinned, WifiOff } from 'lucide-react';
import { Card, DataState, PageHeader } from '../components/ui';
import { SortableTable, type Column } from '../components/SortableTable';
import { useFilteredFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import type { CiudadRendimiento } from '../types';
import { formatCOP, formatCOPCompact, formatNumber, formatPercent } from '../utils/format';

const COLUMNAS: Column<CiudadRendimiento>[] = [
  { key: 'posicion', label: '#', align: 'center' },
  { key: 'ciudad', label: 'Ciudad', render: (r) => <span className="font-medium">{r.ciudad}</span> },
  { key: 'departamento', label: 'Departamento' },
  { key: 'ingresos', label: 'Ingresos', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.ingresos) },
  { key: 'num_ventas', label: 'Ventas', align: 'right', render: (r) => formatNumber(r.num_ventas) },
  { key: 'participacion', label: 'Participación', align: 'right', className: 'whitespace-nowrap', sortValue: (r) => r.participacion ?? 0, render: (r) => formatPercent(r.participacion) },
  { key: 'ticket_promedio', label: 'Ticket prom.', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.ticket_promedio) },
  { key: 'utilidad', label: 'Utilidad', align: 'right', className: 'whitespace-nowrap', render: (r) => formatCOP(r.utilidad) },
  { key: 'margen', label: 'Margen', align: 'right', className: 'whitespace-nowrap', sortValue: (r) => r.margen ?? 0, render: (r) => formatPercent(r.margen) },
  { key: 'num_clientes', label: 'Clientes', align: 'right' },
];

function radio(ingresos: number, max: number): number {
  return 8 + Math.sqrt(ingresos / (max || 1)) * 28; // área proporcional al ingreso
}

export default function Geography() {
  const ciudades = useFilteredFetch(api.ciudades);
  const [tileError, setTileError] = useState(false);

  return (
    <>
      <PageHeader icon={<MapPinned className="h-5 w-5" />} title="Análisis geográfico"
        description="Rendimiento por ciudad donde ocurrió la venta. El tamaño del marcador es proporcional a los ingresos." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card title="Mapa de ventas en Colombia" subtitle="OpenStreetMap · haga clic en un marcador para ver el detalle" className="xl:col-span-3" bodyClassName="p-0">
          <DataState state={ciudades} height="h-[480px]">
            {(d) => {
              const max = Math.max(...d.map((c) => c.ingresos), 0);
              return (
                <div className="relative h-[480px] overflow-hidden rounded-b-xl bg-slate-200">
                  {tileError && (
                    <div role="status" className="absolute left-14 right-3 top-3 z-[500] flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs text-amber-900 shadow">
                      <WifiOff className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                      <span>Sin conexión con OpenStreetMap: no se cargaron los mosaicos de fondo, pero los marcadores y métricas desde MySQL siguen operativos.</span>
                    </div>
                  )}
                  <MapContainer center={[6.3, -74.6]} zoom={6} scrollWheelZoom className="h-full w-full !bg-slate-200" aria-label="Mapa de ciudades">
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      eventHandlers={{ tileerror: () => setTileError(true), tileload: () => setTileError(false) }} />
                    {d.map((c) => (
                      <CircleMarker key={c.id_ciudad} center={[c.latitud, c.longitud]} radius={radio(c.ingresos, max)}
                        pathOptions={{ color: '#1D4ED8', weight: 2, fillColor: c.posicion === 1 ? '#10B981' : '#2563EB', fillOpacity: 0.55 }}>
                        <LTooltip direction="top">{c.ciudad}</LTooltip>
                        <Popup>
                          <div className="min-w-[200px] space-y-1 text-sm">
                            <p className="text-base font-bold text-ink">{c.ciudad}</p>
                            <p className="text-xs text-muted">{c.departamento}</p>
                            <p><b>Ingresos:</b> {formatCOP(c.ingresos)}</p>
                            <p><b>Ventas:</b> {formatNumber(c.num_ventas)}</p>
                            <p><b>Participación nacional:</b> {formatPercent(c.participacion)}</p>
                            <p><b>Ticket promedio:</b> {formatCOP(c.ticket_promedio)}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              );
            }}
          </DataState>
        </Card>
        <Card title="Participación nacional" subtitle="Porcentaje de los ingresos del periodo" className="xl:col-span-2">
          <DataState state={ciudades} isEmpty={(d) => d.length === 0}>
            {(d) => (
              <ul className="space-y-3">
                {d.map((c) => (
                  <li key={c.id_ciudad}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{c.posicion}. {c.ciudad}</span>
                      <span className="tabular-nums text-muted">{formatPercent(c.participacion)} · {formatCOPCompact(c.ingresos)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${c.participacion ?? 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </Card>
      </div>

      <Card title="Ticket promedio y número de ventas por ciudad">
        <DataState state={ciudades} isEmpty={(d) => d.length === 0}>
          {(d) => (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={d} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="ciudad" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="l" tickFormatter={formatCOPCompact} tick={{ fontSize: 11 }} width={80} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold">{label}</p>
                    <p>Ticket promedio: {formatCOP(payload[0]?.value as number)}</p>
                    <p>Ventas: {formatNumber(payload[1]?.value as number)}</p>
                  </div>) : null} />
                <Legend />
                <Bar yAxisId="l" dataKey="ticket_promedio" name="Ticket promedio" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="r" dataKey="num_ventas" name="Número de ventas" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </DataState>
      </Card>

      <Card title="Rendimiento regional" subtitle="Haga clic en los encabezados para ordenar">
        <DataState state={ciudades} isEmpty={(d) => d.length === 0}>
          {(d) => <SortableTable rows={d} columns={COLUMNAS} rowKey={(r) => r.id_ciudad} initialSort={{ key: 'ingresos', dir: 'desc' }} />}
        </DataState>
      </Card>
    </>
  );
}
