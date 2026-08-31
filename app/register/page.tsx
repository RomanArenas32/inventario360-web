'use client';

import { api } from '@/lib/api';
import { setOnboarded, setToken } from '@/lib/auth';
import AuthSplitLayout from '@/components/auth/auth-split-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const MODULES = [
  { id: 'products', icon: '📦', label: 'Productos', description: 'Catálogo y precios' },
  { id: 'stock', icon: '📊', label: 'Stock', description: 'Inventario y movimientos' },
  { id: 'sales', icon: '💰', label: 'Ventas', description: 'Registro de ventas' },
  { id: 'turns', icon: '📅', label: 'Turnos', description: 'Agenda y reservas' },
] as const;

type ModuleId = (typeof MODULES)[number]['id'];
const ALL_MODULE_IDS = MODULES.map((m) => m.id) as ModuleId[];

type Step = 'name' | 'modules';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const [businessName, setBusinessName] = useState('');
  const [selected, setSelected] = useState<ModuleId[]>(ALL_MODULE_IDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleModule(id: ModuleId) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const reg = await api.post<{ access_token: string }>('/auth/register-tenant', {
        name: businessName.trim(),
      });
      setToken(reg.access_token);

      // Save selected modules if not all
      if (selected.length < ALL_MODULE_IDS.length) {
        await api.patch('/tenants/staff-modules', { modules: selected });
      }

      // Reset onboarded cookie so the proxy allows /onboarding for the new tenant
      setOnboarded(false);
      router.push('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el negocio');
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
      {step === 'name' ? (
        <>
          <div className="mb-8">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
              Registro gratuito
            </p>
            <h1 className="text-2xl font-bold text-foreground">Creá tu negocio</h1>
            <p className="text-sm text-muted-foreground mt-1">
              30 días gratis, sin tarjeta de crédito.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (businessName.trim()) setStep('modules');
            }}
            className="space-y-4"
          >
            <div>
              <Label className="mb-1.5">¿Cómo se llama tu negocio?</Label>
              <Input
                autoFocus
                required
                placeholder="Ej: Ferretería El Tornillo"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoCapitalize="words"
              />
            </div>

            <Button type="submit" className="w-full" disabled={!businessName.trim()}>
              Continuar →
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-6">
            <button
              onClick={() => setStep('name')}
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-foreground">¿Qué usás en tu negocio?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Activá los módulos que necesitás. Podés cambiarlos después.
            </p>
          </div>

          <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
            <div className="space-y-2">
              {MODULES.map((mod) => {
                const isSelected = selected.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    <span className="text-xl">{mod.icon}</span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}
                      >
                        {mod.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{mod.description}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      {isSelected && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading || selected.length === 0}
            >
              {loading ? 'Creando negocio...' : 'Empezar ahora →'}
            </Button>
          </form>
        </>
      )}
    </AuthSplitLayout>
  );
}
