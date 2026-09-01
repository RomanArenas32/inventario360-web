import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Sliders,
} from 'lucide-react';
import type { Product, StockMovement } from '@/lib/client';
import { NewSaleButton } from './_components/new-sale-button';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type SalesSummary = { total: number; count: number; profit: number; avgTicket: number };
type PaginatedMovements = { data: StockMovement[]; total: number };
type Me = { name: string; tenant: { name: string } | null };

async function fetchJson<T>(url: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

function formatCurrency(v: number): string {
  return `$${Math.round(v).toLocaleString('es-AR')}`;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function pctDiff(today: number, yesterday: number): number | null {
  if (yesterday === 0) return today > 0 ? 100 : null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

const MOVEMENT_META = {
  entry: {
    label: 'Entrada',
    delta: (q: number) => `+${q}`,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-950/50',
    Icon: TrendingUp,
  },
  exit: {
    label: 'Salida',
    delta: (q: number) => `-${q}`,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-950/50',
    Icon: TrendingDown,
  },
  adjustment: {
    label: 'Ajuste',
    delta: (q: number) => `=${q}`,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-950/50',
    Icon: Sliders,
  },
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('inv360_at')?.value ?? '';

  const [me, products, salesToday, salesYesterday, movementsRes] = await Promise.all([
    fetchJson<Me>(`${API_URL}/auth/me`, token),
    fetchJson<Product[]>(`${API_URL}/products`, token),
    fetchJson<SalesSummary>(`${API_URL}/sales/summary?period=today`, token),
    fetchJson<SalesSummary>(`${API_URL}/sales/summary?period=yesterday`, token),
    fetchJson<PaginatedMovements>(`${API_URL}/stock-movements?limit=5&offset=0`, token),
  ]);

  const productList = products ?? [];
  const activeProducts = productList.filter((p) => p.isActive);
  const sinStock = activeProducts.filter((p) => p.stock === 0);
  const stockBajo = activeProducts.filter(
    (p) => p.stock > 0 && p.minStock > 0 && p.stock <= p.minStock,
  );
  const inventoryValue = activeProducts
    .filter((p) => (p.costPrice ?? 0) > 0)
    .reduce((s, p) => s + p.stock * (p.costPrice ?? 0), 0);
  const hasInventoryValue = activeProducts.some((p) => (p.costPrice ?? 0) > 0);
  const allGood = sinStock.length === 0 && stockBajo.length === 0 && activeProducts.length > 0;
  const movements = movementsRes?.data ?? [];

  const firstName = me?.name?.split(' ')[0] ?? '';
  const tenantName = me?.tenant?.name ?? '';
  const todayRaw = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const todayStr = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);
  const totalPct =
    salesToday && salesYesterday ? pctDiff(salesToday.total, salesYesterday.total) : null;

  return (
    <div className="space-y-6">
      {/* ── Greeting ─────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {firstName ? `Hola, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tenantName || todayStr}</p>
        </div>
        <p className="hidden sm:block text-xs text-muted-foreground">{todayStr}</p>
      </div>

      {/* ── Stats row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          href="/products"
          className="bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow group"
        >
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
            Productos
          </p>
          <p className="text-3xl font-bold text-foreground">{activeProducts.length}</p>
        </Link>

        <Link
          href="/stock"
          className={`rounded-2xl p-5 border hover:shadow-sm transition-shadow ${
            sinStock.length > 0
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
              : 'bg-card border-border'
          }`}
        >
          <p
            className={`text-xs font-medium uppercase tracking-wide mb-2 ${
              sinStock.length > 0 ? 'text-red-400' : 'text-muted-foreground'
            }`}
          >
            Sin stock
          </p>
          <p
            className={`text-3xl font-bold ${
              sinStock.length > 0 ? 'text-red-600' : 'text-muted-foreground/25'
            }`}
          >
            {sinStock.length}
          </p>
        </Link>

        <Link
          href="/stock"
          className={`rounded-2xl p-5 border hover:shadow-sm transition-shadow ${
            stockBajo.length > 0
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-card border-border'
          }`}
        >
          <p
            className={`text-xs font-medium uppercase tracking-wide mb-2 ${
              stockBajo.length > 0 ? 'text-amber-500' : 'text-muted-foreground'
            }`}
          >
            Stock bajo
          </p>
          <p
            className={`text-3xl font-bold ${
              stockBajo.length > 0 ? 'text-amber-500' : 'text-muted-foreground/25'
            }`}
          >
            {stockBajo.length}
          </p>
        </Link>
      </div>

      {/* ── Two-column layout ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Main column ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sales widget */}
          {salesToday && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={14} className="text-blue-500" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Ventas hoy
                  </span>
                </div>
                <Link href="/sales" className="text-xs text-blue-500 font-medium hover:underline">
                  Ver todas →
                </Link>
              </div>

              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Facturado</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(salesToday.total)}
                  </p>
                  {totalPct !== null && (
                    <div
                      className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${
                        totalPct >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {totalPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {totalPct >= 0 ? '+' : ''}
                      {totalPct}% vs ayer
                    </div>
                  )}
                </div>

                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Ventas</p>
                  <p className="text-2xl font-bold text-foreground">{salesToday.count}</p>
                  {salesToday.avgTicket > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      prom. {formatCurrency(salesToday.avgTicket)}
                    </p>
                  )}
                </div>

                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Ganancia</p>
                  <p
                    className={`text-2xl font-bold ${
                      salesToday.profit > 0 ? 'text-green-600' : 'text-muted-foreground/25'
                    }`}
                  >
                    {salesToday.profit > 0 ? formatCurrency(salesToday.profit) : '—'}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-4">
                <NewSaleButton />
              </div>
            </div>
          )}

          {/* Sin stock */}
          {sinStock.length > 0 && (
            <div className="bg-card rounded-2xl overflow-hidden border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 dark:border-red-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-red-500" />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                    Sin stock · {sinStock.length}
                  </span>
                </div>
                <Link href="/stock" className="text-xs text-red-500 font-medium hover:underline">
                  Ver todos →
                </Link>
              </div>
              <div className="divide-y divide-border">
                {sinStock.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-red-500 font-medium mt-0.5">Sin stock</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/30" />
                  </div>
                ))}
                {sinStock.length > 4 && (
                  <Link
                    href="/stock"
                    className="flex items-center justify-center px-5 py-3 gap-1 text-xs text-red-500 font-medium hover:underline"
                  >
                    Ver {sinStock.length - 4} más <ChevronRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Stock bajo */}
          {stockBajo.length > 0 && (
            <div className="bg-card rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 dark:border-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Stock bajo · {stockBajo.length}
                  </span>
                </div>
                <Link href="/stock" className="text-xs text-amber-600 font-medium hover:underline">
                  Ver todos →
                </Link>
              </div>
              <div className="divide-y divide-border">
                {stockBajo.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Stock: <span className="text-amber-500 font-semibold">{p.stock}</span>
                        {' · '}mín. {p.minStock}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/30" />
                  </div>
                ))}
                {stockBajo.length > 4 && (
                  <Link
                    href="/stock"
                    className="flex items-center justify-center px-5 py-3 gap-1 text-xs text-amber-600 font-medium hover:underline"
                  >
                    Ver {stockBajo.length - 4} más <ChevronRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* All good */}
          {allGood && (
            <div className="flex items-center gap-2.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-4">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Todo el stock en orden
              </p>
            </div>
          )}
        </div>

        {/* ── Sidebar column ───────────────────────────────────── */}
        <div className="space-y-5">
          {/* Inventory value */}
          {hasInventoryValue && (
            <Link
              href="/products"
              className="flex flex-col bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow"
            >
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                Valor del inventario
              </p>
              <p className="text-2xl font-bold text-foreground mb-3">
                {formatCurrency(inventoryValue)}
              </p>
              <span className="self-start text-xs text-blue-500 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg font-medium">
                a precio de costo
              </span>
            </Link>
          )}

          {/* Recent activity */}
          {movements.length > 0 && (
            <div className="bg-card rounded-2xl overflow-hidden border border-border">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Actividad reciente
                </span>
                <Link href="/stock" className="text-xs text-blue-500 font-medium hover:underline">
                  Historial →
                </Link>
              </div>
              <div className="divide-y divide-border">
                {movements.map((m) => {
                  const meta = MOVEMENT_META[m.type];
                  const Icon = meta.Icon;
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}
                      >
                        <Icon size={13} className={meta.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {m.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {m.reason || meta.label} · {m.user.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${meta.color}`}>
                          {meta.delta(m.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimeAgo(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
