'use client';

import { api } from '@/lib/api';
import { clearSession, setOnboarded } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { PhoneInput, formatPhone, parsePhone, type PhoneValue } from '@/components/ui/phone-input';
import {
  LogOut,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Tag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'almacen',            label: 'Almacén',      icon: '🛒', desc: 'Minimercado' },
  { value: 'kiosco',             label: 'Kiosco',        icon: '🗞️', desc: 'Revistas y más' },
  { value: 'ferreteria',         label: 'Ferretería',    icon: '🔧', desc: 'Materiales' },
  { value: 'barberia',           label: 'Barbería',      icon: '✂️', desc: 'Estética' },
  { value: 'restaurante',        label: 'Restaurante',   icon: '🍽️', desc: 'Gastronomía' },
  { value: 'tienda_ropa',        label: 'Indumentaria',  icon: '👗', desc: 'Moda' },
  { value: 'tienda_electronica', label: 'Electrónica',   icon: '💻', desc: 'Tecnología' },
];

const STEP_META = [
  {
    title: 'Empecemos\npor el principio',
    sub: 'Cada negocio es único. Contanos el tuyo para personalizar tu experiencia.',
  },
  {
    title: 'Poné tu\nnegocio en el mapa',
    sub: 'Esta información aparecerá en tu panel de control y en tus reportes.',
  },
  {
    title: '¡Ya estás\nlisto para empezar!',
    sub: 'Tu inventario te espera. Tomá el control de tu negocio hoy mismo.',
  },
];

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessType: '',
    businessName: '',
    phone: { countryCode: '+54', number: '' } as PhoneValue,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void api.get<{ tenant: { name: string; phone: string | null } | null }>('/auth/me').then((me) => {
      if (me.tenant) {
        setFormData((d) => ({
          ...d,
          businessName: me.tenant!.name ?? '',
          phone: parsePhone(me.tenant!.phone ?? ''),
        }));
      }
    });
  }, []);
  const [error, setError] = useState('');

  const selectedType = BUSINESS_TYPES.find((t) => t.value === formData.businessType);
  const meta = STEP_META[step - 1];

  async function handleFinish() {
    setLoading(true);
    setError('');
    try {
      await api.patch('/tenants/onboarding', {
        businessType: formData.businessType,
        ...(formData.businessName && { businessName: formData.businessName }),
        ...(formData.phone.number && { phone: formatPhone(formData.phone) }),
      });
      setOnboarded(true);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // ignorar
    }
    clearSession();
    router.push('/login');
  }

  const canAdvance =
    (step === 1 && !!formData.businessType) ||
    (step === 2 && !!formData.businessName.trim());

  return (
    <div className="min-h-screen flex">
      {/* ── Panel izquierdo (branding) ── */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'oklch(0.46 0.26 264.376)' }}
      >
        {/* Patrón de puntos */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Image src="/logos/marca2-white.svg" alt="Inventario360" width={200} height={60} className="h-40" style={{ width: 'auto' }} unoptimized />
        </div>

        {/* Título dinámico por paso */}
        <div key={step} className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-white text-4xl font-bold leading-tight mb-4 whitespace-pre-line">
            {meta.title}
          </h2>
          <p className="text-white/65 text-base leading-relaxed max-w-xs">{meta.sub}</p>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 space-y-3">
          <div className="bg-white/10 border border-white/15 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <BarChart3 size={17} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Control de stock en tiempo real</p>
              <p className="text-white/55 text-xs mt-0.5">Alertas de stock bajo automáticas</p>
            </div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <Tag size={17} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Productos y categorías</p>
              <p className="text-white/55 text-xs mt-0.5">Organizá tu catálogo fácilmente</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-border">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const n = i + 1;
              const done = n < step;
              const active = n === step;
              return (
                <div key={n} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      done
                        ? 'bg-primary text-primary-foreground'
                        : active
                        ? 'bg-primary/10 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <CheckCircle2 size={15} /> : n}
                  </div>
                  {i < TOTAL_STEPS - 1 && (
                    <div
                      className={`h-px w-10 transition-all duration-500 ${
                        n < step ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle hideLabel className="h-8 w-8 text-muted-foreground hover:text-foreground" />
            <Button
              variant="ghost"
              onClick={() => void handleLogout()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut size={13} />
              Salir
            </Button>
          </div>
        </div>

        {/* Contenido del paso */}
        <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-8 py-6 sm:py-10 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Paso 1 — Tipo de negocio */}
            {step === 1 && (
              <div key="step-1" className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  ¿Qué tipo de comercio tenés?
                </h1>
                <p className="text-muted-foreground text-sm mb-6">
                  Esto nos ayuda a adaptar el sistema a tu negocio
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3">
                  {BUSINESS_TYPES.map((type) => {
                    const isSelected = formData.businessType === type.value;
                    return (
                      <Card
                        key={type.value}
                        onClick={() => setFormData((d) => ({ ...d, businessType: type.value }))}
                        className={`flex flex-col items-center gap-1.5 py-4 px-3 text-center cursor-pointer select-none transition-all duration-150 hover:scale-[1.03] hover:shadow-md active:scale-[0.97] ${
                          isSelected
                            ? 'ring-2 ring-primary bg-primary/5 shadow-sm'
                            : 'hover:ring-1 hover:ring-muted-foreground/30'
                        }`}
                      >
                        <span className="text-2xl">{type.icon}</span>
                        <span
                          className={`text-xs font-semibold leading-tight ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {type.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{type.desc}</span>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Paso 2 — Datos del negocio */}
            {step === 2 && (
              <div key="step-2" className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-2xl">{selectedType?.icon}</span>
                  <h1 className="text-2xl font-bold text-foreground">Datos de tu negocio</h1>
                </div>
                <p className="text-muted-foreground text-sm mb-7">
                  Podés actualizar esto más tarde desde tu perfil
                </p>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      Nombre del negocio{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      placeholder={`Ej: Mi ${selectedType?.label ?? 'Negocio'}`}
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, businessName: e.target.value }))
                      }
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Teléfono{' '}
                      <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
                    </Label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(v) => setFormData((d) => ({ ...d, phone: v }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3 — Confirmación */}
            {step === 3 && (
              <div
                key="step-3"
                className="animate-in fade-in zoom-in-95 duration-300 text-center"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={38} className="text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">¡Todo configurado!</h1>
                <p className="text-muted-foreground text-sm mb-7">
                  Tu cuenta está lista. Aquí un resumen de lo que guardamos:
                </p>

                <div className="bg-muted/50 border border-border rounded-xl p-5 text-left space-y-3 mb-7">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipo de negocio</span>
                    <span className="font-medium text-foreground">
                      {selectedType?.icon} {selectedType?.label}
                    </span>
                  </div>
                  {formData.businessName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nombre</span>
                      <span className="font-medium text-foreground">{formData.businessName}</span>
                    </div>
                  )}
                  {formData.phone.number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Teléfono</span>
                      <span className="font-medium text-foreground">{formatPhone(formData.phone)}</span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-4 text-left">
                    <AlertCircle size={15} className="shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Navegación */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1}
                className="gap-2 text-muted-foreground"
              >
                <ArrowLeft size={15} />
                Anterior
              </Button>

              {step < TOTAL_STEPS ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance} className="gap-2">
                  Siguiente
                  <ArrowRight size={15} />
                </Button>
              ) : (
                <Button
                  onClick={() => void handleFinish()}
                  disabled={loading}
                  className="gap-2 min-w-36"
                >
                  {loading ? 'Guardando...' : 'Ir al panel →'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
