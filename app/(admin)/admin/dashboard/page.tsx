'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

type Tenant = {
  id: string;
  isActive: boolean;
  plan: string;
};

export default function AdminDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    void api.get<Tenant[]>('/admin/tenants').then(setTenants).catch(() => null);
  }, []);

  const active = tenants.filter((t) => t.isActive).length;
  const pro = tenants.filter((t) => t.plan === 'pro').length;

  const stats = [
    { label: 'Total comercios', value: tenants.length, color: 'text-foreground' },
    { label: 'Activos', value: active, color: 'text-green-500' },
    { label: 'Inactivos', value: tenants.length - active, color: 'text-red-500' },
    { label: 'Plan Pro', value: pro, color: 'text-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground mt-1">Resumen de la plataforma</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
