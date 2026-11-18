export interface Filtros {
  fecha_inicio: string;
  fecha_fin: string;
  ciudad_id: string;
  vendedor_id: string;
  categoria_id: string;
}

export interface Periodo { inicio: string; fin: string }

export interface Kpis {
  ingresos_totales: number;
  costos_totales: number;
  utilidad_total: number;
  margen_utilidad: number | null;
  total_transacciones: number;
  ticket_promedio: number;
  total_clientes: number;
  productos_vendidos_unidades: number;
  crecimiento_periodo: number | null;
  ingresos_periodo_actual: number | null;
  ingresos_periodo_anterior: number | null;
  periodos: { actual: Periodo | null; anterior: Periodo | null; criterio: string };
}

export interface VentaMensual {
  anio: number; mes: number; periodo: string; etiqueta: string;
  num_ventas: number; ingresos: number; costos: number; utilidad: number; unidades: number; margen: number | null;
}

export interface CiudadRendimiento {
  id_ciudad: number; ciudad: string; departamento: string; latitud: number; longitud: number;
  num_ventas: number; num_clientes: number; unidades: number; ingresos: number; costos: number; utilidad: number;
  posicion: number; participacion: number | null; ticket_promedio: number; margen: number | null;
}

export interface VendedorRanking {
  id_vendedor: number; nombre: string; ciudad_asignada: string; fecha_contratacion: string;
  num_ventas: number; num_clientes: number; unidades: number; ingresos: number; costos: number; utilidad: number;
  posicion: number; participacion: number | null; ticket_promedio: number; margen: number | null;
}

export interface CategoriaRentabilidad {
  id_categoria: number; categoria: string; num_ventas: number; unidades: number;
  ingresos_netos: number; costos: number; utilidad: number;
  rank_utilidad: number; rank_facturacion: number; margen: number | null; participacion: number | null;
}

export interface ProductoRanking {
  id_producto: number; sku: string; nombre: string; categoria: string; activo: number; precio_lista: number;
  num_ventas: number; unidades: number; ingresos: number; costos: number; utilidad: number;
  posicion: number; margen: number | null; participacion: number | null; precio_promedio: number; supera_promedio: boolean;
}

export interface ClienteRecurrente {
  id_cliente: number; nombre: string; ciudad: string; num_compras: number; ingresos: number;
  primera_compra: string; ultima_compra: string; ticket_promedio: number;
}

export type Segmento = 'Premium' | 'Potencial premium' | 'Regular';

export interface ClienteRfm {
  id_cliente: number; documento: string; nombre: string; ciudad: string; num_compras: number; ingresos: number;
  ticket_promedio: number; ultima_compra: string; dias_desde_ultima: number; percentil_gasto: number;
  cumple_frecuencia: boolean; cumple_recencia: boolean; cumple_monetario: boolean;
  criterios_cumplidos: number; segmento: Segmento;
}

export interface ResumenSegmento {
  segmento: Segmento; clientes: number; ingresos: number; ticket_promedio: number; participacion_ingresos: number | null;
}

export interface PremiumResponse {
  fecha_corte: string;
  criterios: { frecuencia_minima: number; recencia_maxima_dias: number; percentil_monetario_minimo: number; regla: string };
  resumen: ResumenSegmento[];
  clientes: ClienteRfm[];
}

export interface Hallazgo { titulo: string; valor: string; detalle: string; tipo: string }

export interface Riesgo {
  riesgo: string; metrica: string; valor: number; umbral: number; unidad: string; detectado: boolean; evidencia: string;
}

export interface CrecimientoCiudad {
  ciudad: string; ingresos_actual: number; ingresos_anterior: number; crecimiento: number | null;
}

export interface AnalisisEjecutivo {
  sin_datos: boolean;
  kpis: Kpis;
  ciudad_lider?: CiudadRendimiento;
  ciudad_mayor_crecimiento?: CrecimientoCiudad | null;
  crecimiento_ciudades?: CrecimientoCiudad[];
  vendedor_lider?: VendedorRanking;
  vendedor_mayor_ticket?: VendedorRanking;
  vendedor_mayor_margen?: VendedorRanking;
  categoria_mayor_utilidad?: CategoriaRentabilidad;
  categoria_mayor_facturacion?: CategoriaRentabilidad;
  categoria_mayor_margen?: CategoriaRentabilidad;
  productos_destacados?: { por_ingresos: ProductoRanking[]; por_unidades: ProductoRanking[] };
  concentracion?: {
    top3_vendedores_pct: number; ciudad_lider_pct: number; categoria_lider_pct: number;
    hhi_ciudades: number; hhi_categorias: number; hhi_vendedores: number;
    coeficiente_variacion_mensual: number; tasa_recompra_pct: number;
  };
  hallazgos: Hallazgo[];
  riesgos: Riesgo[];
  recomendaciones: string[];
}

export interface OpcionCatalogo { id: number; nombre: string }

export interface Catalogos {
  ciudades: OpcionCatalogo[];
  vendedores: OpcionCatalogo[];
  categorias: OpcionCatalogo[];
  rango_fechas: { minima: string | null; maxima: string | null };
}

export interface ConsultaSql {
  numero: number; titulo: string; descripcion: string; sql: string;
  fecha_corte?: string; columnas?: string[]; filas?: Record<string, unknown>[];
}
