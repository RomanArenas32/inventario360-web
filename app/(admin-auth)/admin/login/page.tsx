'use client';

import { api } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post<{ access_token: string }>('/auth/login', form);
      const me = await api.get<{ role: string }>('/auth/me', data.access_token);
      if (me.role !== 'admin') {
        setError('Acceso no autorizado');
        return;
      }
      setSession(data.access_token, me.role, true);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors" />
      </div>
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="mb-8">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Panel de administración
          </p>
          <h1 className="text-2xl font-bold text-foreground">Inventario360</h1>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <Label className="mb-1 text-muted-foreground">Email</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@inventario360.com"
            />
          </div>

          <div>
            <Label className="mb-1 text-muted-foreground">Contraseña</Label>
            <Input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
