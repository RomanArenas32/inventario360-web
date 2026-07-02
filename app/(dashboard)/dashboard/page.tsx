'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

type Product = { id: string; stock: number; minStock: number; isActive: boolean };
type Category = { id: string };

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    void Promise.all([
      api.get<Product[]>('/products').then(setProducts).catch(() => null),
      api.get<Category[]>('/categories').then(setCategories).catch(() => null),
      api.get<Product[]>('/products/low-stock').then(setLowStock).catch(() => null),
    ]);
  }, []);

  const active = products.filter((p) => p.isActive).length;

  const stats = [
    { label: 'Productos', value: products.length, color: 'text-blue-500' },
    { label: 'Activos', value: active, color: 'text-green-500' },
    { label: 'Stock bajo', value: lowStock.length, color: 'text-amber-500' },
    { label: 'Categorías', value: categories.length, color: 'text-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground mt-1">Resumen de tu inventario</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
            Alerta: {lowStock.length} producto{lowStock.length !== 1 ? 's' : ''} con stock bajo
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
            Revisá la sección de Stock para ver el detalle.
          </p>
        </div>
      )}
    </div>
  );
}
