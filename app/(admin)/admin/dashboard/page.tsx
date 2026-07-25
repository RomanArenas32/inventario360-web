'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Sparkles, Store, XCircle } from 'lucide-react';

type Tenant = {
  id: string;
  isActive: boolean;
  plan: string;
};

export default function AdminDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    void api
      .get<Tenant[]>('/admin/tenants')
      .then(setTenants)
      .catch(() => null);
  }, []);

  const active = tenants.filter((t) => t.isActive).length;
  const pro = tenants.filter((t) => t.plan === 'pro').length;

  const stats = [
    {
      label: 'Total comercios',
      value: tenants.length,
      color: 'text-blue-500',
      icon: Store,
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
      label: 'Inactivos',
      value: tenants.length - active,
      color: 'text-red-500',
      icon: XCircle,
      iconBg: 'bg-red-50 dark:bg-red-950/50 text-red-500',
    },
    {
      label: 'Plan Pro',
      value: pro,
      color: 'text-purple-500',
      icon: Sparkles,
      iconBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-500',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground mt-1">Resumen de la plataforma</p>

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
    </div>
  );
}
