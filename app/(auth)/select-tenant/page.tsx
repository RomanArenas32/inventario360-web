'use client';

import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type TenantOption = { id: string; name: string; role: string };
type Me = {
  role: string;
  tenants: TenantOption[];
  tenant: { isOnboarded: boolean } | null;
};

export default function SelectTenantPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    void api
      .get<Me>('/auth/me')
      .then((data) => {
        if (data.role === 'admin') {
          router.replace('/admin/dashboard');
          return;
        }
        if (data.tenant) {
          router.replace(data.tenant.isOnboarded ? '/dashboard' : '/onboarding');
          return;
        }
        setMe(data);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function selectTenant(tenantId: string) {
    setLoading(tenantId);
    try {
      await api.post('/auth/switch-tenant', { tenantId });
      const updated = await api.get<Me>('/auth/me');
      setSession(updated.role, updated.tenant?.isOnboarded ?? false);
      router.push(updated.tenant?.isOnboarded ? '/dashboard' : '/onboarding');
    } catch {
      setLoading(null);
    }
  }

  if (!me) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground text-sm">
        Cargando...
      </div>
    );
  }

  const ROLE_LABEL: Record<string, string> = { owner: 'Dueño', staff: 'Empleado' };

  return (
    <div className="h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-foreground mb-1">Seleccioná un negocio</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Tenés acceso a {me.tenants.length} negocios. ¿A cuál querés entrar?
        </p>
        <div className="space-y-3">
          {me.tenants.map((t) => (
            <Card key={t.id} className="p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABEL[t.role] ?? t.role}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => void selectTenant(t.id)}
                  disabled={loading !== null}
                >
                  {loading === t.id ? 'Entrando...' : 'Entrar'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
