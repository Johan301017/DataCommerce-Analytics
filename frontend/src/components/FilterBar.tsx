import { Filter, X } from 'lucide-react';
import { useFilters } from '../context/FiltersContext';
import { formatDate } from '../utils/format';

export function FilterBar() {
  const { filtros, setFiltro, limpiar, catalogos, catalogosError, activos } = useFilters();
  const min = catalogos?.rango_fechas.minima ?? undefined;
  const max = catalogos?.rango_fechas.maxima ?? undefined;
  const fechaInvalida = filtros.fecha_inicio && filtros.fecha_fin && filtros.fecha_inicio > filtros.fecha_fin;

  return (
    <div className="border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8" aria-label="Filtros globales">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full items-center gap-2 self-center text-sm font-semibold text-ink sm:w-auto">
          <Filter className="h-4 w-4 text-primary" aria-hidden /> Filtros
          {activos > 0 && <span className="badge bg-primary text-white">{activos}</span>}
        </div>
        <label className="w-[calc(50%-0.4rem)] sm:w-40">
          <span className="mb-1 block text-xs text-muted">Fecha inicial</span>
          <input type="date" className="input" value={filtros.fecha_inicio} min={min} max={max}
            onChange={(e) => setFiltro('fecha_inicio', e.target.value)} />
        </label>
        <label className="w-[calc(50%-0.4rem)] sm:w-40">
          <span className="mb-1 block text-xs text-muted">Fecha final</span>
          <input type="date" className="input" value={filtros.fecha_fin} min={min} max={max}
            onChange={(e) => setFiltro('fecha_fin', e.target.value)} />
        </label>
        <label className="w-full sm:w-44">
          <span className="mb-1 block text-xs text-muted">Ciudad de la venta</span>
          <select className="input" value={filtros.ciudad_id} onChange={(e) => setFiltro('ciudad_id', e.target.value)}>
            <option value="">Todas las ciudades</option>
            {catalogos?.ciudades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label className="w-full sm:w-52">
          <span className="mb-1 block text-xs text-muted">Vendedor</span>
          <select className="input" value={filtros.vendedor_id} onChange={(e) => setFiltro('vendedor_id', e.target.value)}>
            <option value="">Todos los vendedores</option>
            {catalogos?.vendedores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label className="w-full sm:w-48">
          <span className="mb-1 block text-xs text-muted">Categoría</span>
          <select className="input" value={filtros.categoria_id} onChange={(e) => setFiltro('categoria_id', e.target.value)}>
            <option value="">Todas las categorías</option>
            {catalogos?.categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label className="w-full sm:w-56">
          <span className="mb-1 block text-xs text-muted">Producto</span>
          <select className="input" value={filtros.producto_id} onChange={(e) => setFiltro('producto_id', e.target.value)}>
            <option value="">Todos los productos</option>
            {catalogos?.productos?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </label>
        <button type="button" onClick={limpiar} disabled={activos === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-ink hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">
          <X className="h-4 w-4" aria-hidden /> Limpiar filtros
        </button>
      </div>
      <div className="mt-2 text-xs text-muted">
        {catalogosError ? <span className="text-red-600">No se pudieron cargar los catálogos: {catalogosError}</span>
          : min && max ? <>Datos disponibles: {formatDate(min)} a {formatDate(max)}</> : 'Cargando catálogos…'}
        {fechaInvalida && <span className="ml-2 font-medium text-red-600">La fecha inicial es posterior a la final.</span>}
      </div>
    </div>
  );
}
