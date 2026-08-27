import { cookies } from 'next/headers';
import type { Category, Product } from '@/lib/client';
import { Card } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Package, Tag } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchJson<T>(url: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Cookie: `inv360_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('inv360_token')?.value ?? '';

  const [products, categories, lowStock] = await Promise.all([
    fetchJson<Product[]>(`${API_URL}/products`, token),
    fetchJson<Category[]>(`${API_URL}/categories`, token),
    fetchJson<Product[]>(`${API_URL}/products/low-stock`, token),
  ]);

  const productList = products ?? [];
  const categoryList = categories ?? [];
  const lowStockList = lowStock ?? [];
  const active = productList.filter((p) => p.isActive).length;

  const stats = [
    {
      label: 'Productos',
      value: productList.length,
      color: 'text-blue-500',
      icon: Package,
      iconBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-500',
    },
    {
      label: 'Activos',
      value: active,
      color: 'text-green-500',
      icon: CheckCircle2,
      iconBg: 'bg-green-50 dark:bg-green-950/50 text-green-500',
    },
    {
      label: 'Stock bajo',
      value: lowStockList.length,
      color: 'text-amber-500',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-500',
    },
    {
      label: 'Categorías',
      value: categoryList.length,
      color: 'text-purple-500',
      icon: Tag,
      iconBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-500',
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen de tu inventario" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg shrink-0 ${stat.iconBg}`}>
                <stat.icon size={18} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {lowStockList.length > 0 && (
        <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              Alerta: {lowStockList.length} producto{lowStockList.length !== 1 ? 's' : ''} con stock
              bajo
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Revisá la sección de Stock para ver el detalle.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
