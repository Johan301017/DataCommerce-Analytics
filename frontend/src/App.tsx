import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BarChart3, Brain, Database, LayoutDashboard, MapPinned, Menu, Package, UserRound, Users, X } from 'lucide-react';
import { FilterBar } from './components/FilterBar';
import { useFetch } from './hooks/useFetch';
import { api } from './services/api';
import Overview from './pages/Overview';
import Geography from './pages/Geography';
import Sellers from './pages/Sellers';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Intelligence from './pages/Intelligence';
import SqlQueries from './pages/SqlQueries';

const NAV = [
  { to: '/', label: 'Vista general', icon: LayoutDashboard, end: true },
  { to: '/geografia', label: 'Análisis geográfico', icon: MapPinned },
  { to: '/vendedores', label: 'Vendedores', icon: UserRound },
  { to: '/productos', label: 'Productos y categorías', icon: Package },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/inteligencia', label: 'Inteligencia comercial', icon: Brain },
  { to: '/consultas', label: 'Consultas SQL', icon: Database },
];

function ApiStatus() {
  const health = useFetch((s) => api.health(s), []);
  const ok = health.data?.database === 'conectada';
  const label = health.loading ? 'Verificando…' : ok ? 'MySQL conectado' : 'Sin conexión';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-muted" title="Estado del backend y la base de datos">
      <span className={`h-2 w-2 rounded-full ${health.loading ? 'bg-amber-400' : ok ? 'bg-success' : 'bg-red-500'}`} />
      {label}
    </span>
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:flex">
      {/* Barra lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-navy text-slate-300 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navegación principal"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5"><BarChart3 className="h-5 w-5 text-white" aria-hidden /></div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">DataCommerce</p>
              <p className="text-[11px] text-slate-400">Analytics S.A.S.</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-white shadow' : 'hover:bg-white/5 hover:text-white'}`}>
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-white/10 p-4 text-[11px] text-slate-500">
          Datos sintéticos · MySQL 8.0 · FastAPI · React
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-navy/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20">
          <div className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button className="rounded-md p-1.5 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </button>
              <div className="leading-tight">
                <p className="text-base font-bold text-ink sm:text-lg">DataCommerce Analytics</p>
                <p className="hidden text-xs text-muted sm:block">Business Intelligence &amp; Commercial Performance</p>
              </div>
            </div>
            <ApiStatus />
          </div>
          <FilterBar />
        </header>
        <main className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/geografia" element={<Geography />} />
            <Route path="/vendedores" element={<Sellers />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/inteligencia" element={<Intelligence />} />
            <Route path="/consultas" element={<SqlQueries />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
