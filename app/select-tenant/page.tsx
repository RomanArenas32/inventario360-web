'use client';

import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, ChevronRight } from 'lucide-react';

type Tenant = { id: string; name: string; role: string };

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function SelectTenantPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    void api
      .get<{ role: string; tenants: Tenant[] }>('/auth/me')
      .then((me) => {
        if (me.tenants.length === 0) {
          router.replace('/register');
          return;
        }
        if (me.tenants.length === 1) {
          void handleSelect(me.tenants[0]!, me.role);
          return;
        }
        setTenants(me.tenants);
        setLoading(false);
      })
      .catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(tenant: Tenant, globalRole?: string) {
    setSwitching(tenant.id);
    try {
      await api.post('/auth/switch-tenant', { tenantId: tenant.id });
      const me = await api.get<{ role: string; tenant: { isOnboarded: boolean } | null }>(
        '/auth/me',
      );
      setSession(globalRole ?? me.role, true);
      localStorage.setItem('lastTenantId', tenant.id);
      router.push('/dashboard');
    } catch {
      setSwitching(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
            <Building2 size={22} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">¿Con qué negocio entrás?</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tenés acceso a {tenants.length} negocios. Elegí uno para continuar.
          </p>
        </div>

        <div className="space-y-2">
          {tenants.map((t) => {
            const isSwitching = switching === t.id;
            const roleLabel = t.role === 'owner' ? 'Dueño' : 'Empleado';
            return (
              <button
                key={t.id}
                onClick={() => void handleSelect(t)}
                disabled={!!switching}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-colors text-left disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                  {getInitials(t.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
                {isSwitching ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground/40 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
