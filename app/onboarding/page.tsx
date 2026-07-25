'use client';

import { api } from '@/lib/api';
import { clearSession, setOnboarded } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'almacen', label: 'Almacén / Minimercado', icon: '🛒' },
  { value: 'kiosco', label: 'Kiosco', icon: '🗞️' },
  { value: 'ferreteria', label: 'Ferretería', icon: '🔧' },
  { value: 'barberia', label: 'Barbería / Estética', icon: '✂️' },
  { value: 'restaurante', label: 'Restaurante', icon: '🍽️' },
  { value: 'tienda_ropa', label: 'Tienda de ropa', icon: '👗' },
  { value: 'tienda_electronica', label: 'Electrónica', icon: '💻' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      await api.patch('/tenants/onboarding', { businessType: selected });
      setOnboarded(true);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // ignorar errores — igual limpiamos la sesión local
    }
    clearSession();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 w-full max-w-lg">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">¡Bienvenido!</h1>
            <p className="text-muted-foreground mt-1">¿Qué tipo de comercio tenés?</p>
          </div>
          <button
            onClick={() => void handleLogout()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {BUSINESS_TYPES.map((type) => (
              <Button
                key={type.value}
                type="button"
                variant={selected === type.value ? 'default' : 'outline'}
                onClick={() => setSelected(type.value)}
                className="flex flex-col items-center gap-2 p-4 h-auto rounded-xl"
              >
                <span className="text-2xl">{type.icon}</span>
                {type.label}
              </Button>
            ))}
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <Button type="submit" disabled={!selected || loading} className="w-full">
            {loading ? 'Guardando...' : 'Continuar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
