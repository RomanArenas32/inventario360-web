'use client';

import { api } from '@/lib/api';
import type { NotificationSettings } from '@/lib/client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput, type PhoneValue, parsePhone, formatPhone } from '@/components/ui/phone-input';
import { CheckCircle2, Puzzle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'negocio' | 'modulos' | 'notificaciones' | 'whatsapp' | 'integraciones';
type PushNotifSettings = Pick<
  NotificationSettings,
  'alertLowStock' | 'alertNewSale' | 'alertTurnAssigned'
>;
type WhatsAppSettings = Pick<
  NotificationSettings,
  'whatsappPhone' | 'whatsappOptIn' | 'alertLowStock'
>;
type TenantSettings = { name: string; businessType: string | null; staffModules: string[] | null };
type Module = 'products' | 'stock' | 'sales' | 'turns' | 'services';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; ownerOnly?: boolean }[] = [
  { id: 'negocio', label: 'Mi negocio' },
  { id: 'modulos', label: 'Módulos del staff', ownerOnly: true },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'integraciones', label: 'Integraciones' },
];

const MODULES: { id: Module; label: string; description: string }[] = [
  { id: 'products', label: 'Productos', description: 'Catálogo, precios y categorías' },
  { id: 'stock', label: 'Stock', description: 'Inventario y movimientos' },
  { id: 'sales', label: 'Ventas', description: 'Registro de ventas y facturación' },
  { id: 'turns', label: 'Turnos', description: 'Agenda y gestión de reservas' },
  { id: 'services', label: 'Servicios', description: 'Catálogo de servicios con precios' },
];

const ALL_MODULES: Module[] = MODULES.map((m) => m.id);

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  almacen: 'Almacén',
  kiosco: 'Kiosco',
  ferreteria: 'Ferretería',
  barberia: 'Barbería',
  restaurante: 'Restaurante',
  tienda_ropa: 'Tienda de ropa',
  tienda_electronica: 'Tienda electrónica',
};

const OTHER_INTEGRATIONS = [
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'Procesá pagos y sincronizá ventas automáticamente.',
  },
  {
    id: 'tiendanube',
    name: 'Tiendanube',
    description: 'Sincronizá el stock con tu tienda online.',
  },
];

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Section layout ───────────────────────────────────────────────────────────

function SectionLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="lg:col-span-2">{children}</div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-3 bg-muted rounded w-48" />
        <div className="h-3 bg-muted rounded w-40" />
      </div>
      <div className="lg:col-span-2">
        <Card className="p-6 space-y-4">
          <div className="h-4 bg-muted rounded w-40" />
          <div className="h-9 bg-muted rounded" />
          <div className="h-9 bg-muted rounded w-32" />
        </Card>
      </div>
    </div>
  );
}

// ─── Inner ────────────────────────────────────────────────────────────────────

function SettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') as Tab | null;
  const activeTab: Tab = TABS.some((t) => t.id === rawTab) ? (rawTab as Tab) : 'negocio';

  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [staffModules, setStaffModules] = useState<Module[] | null>(null);
  const [savingModules, setSavingModules] = useState(false);

  const [push, setPush] = useState<PushNotifSettings>({
    alertLowStock: true,
    alertNewSale: true,
    alertTurnAssigned: true,
  });
  const [savingPush, setSavingPush] = useState(false);

  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings>({
    whatsappPhone: null,
    whatsappOptIn: false,
    alertLowStock: true,
  });
  const [phone, setPhone] = useState<PhoneValue>({ countryCode: '+54', number: '' });
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  useEffect(() => {
    void Promise.all([
      api.get<NotificationSettings | null>('/notification-settings').catch(() => null),
      api
        .get<{
          name?: string;
          tenantRole?: string | null;
          tenant?: { phone?: string | null } | null;
        }>('/auth/me')
        .catch(() => null),
      api.get<TenantSettings | null>('/tenants/settings').catch(() => null),
    ]).then(([notifData, meData, tenantData]) => {
      if (notifData) {
        setPush({
          alertLowStock: notifData.alertLowStock,
          alertNewSale: notifData.alertNewSale,
          alertTurnAssigned: notifData.alertTurnAssigned,
        });
        setWhatsapp({
          whatsappPhone: notifData.whatsappPhone,
          whatsappOptIn: notifData.whatsappOptIn,
          alertLowStock: notifData.alertLowStock,
        });
        setPhone(parsePhone(notifData.whatsappPhone ?? meData?.tenant?.phone ?? ''));
      }
      if (tenantData) {
        setBusinessName(tenantData.name ?? '');
        setBusinessType(tenantData.businessType ?? null);
        setStaffModules((tenantData.staffModules as Module[] | null) ?? null);
      }
      setIsOwner(meData?.tenantRole === 'owner');
      setLoading(false);
    });
  }, []);

  function goTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/settings?${params.toString()}`);
  }

  function isModuleOn(mod: Module) {
    return staffModules === null || staffModules.includes(mod);
  }

  function toggleModule(mod: Module) {
    const current = staffModules ?? ALL_MODULES;
    setStaffModules(current.includes(mod) ? current.filter((m) => m !== mod) : [...current, mod]);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) return;
    setSavingName(true);
    try {
      await api.patch('/tenants/settings', { name: businessName.trim() });
      toast.success('Nombre actualizado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveModules() {
    setSavingModules(true);
    try {
      await api.patch('/tenants/staff-modules', { modules: staffModules });
      toast.success('Módulos actualizados');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingModules(false);
    }
  }

  async function handleSavePush() {
    setSavingPush(true);
    try {
      await api.put('/notification-settings', push);
      toast.success('Notificaciones actualizadas');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingPush(false);
    }
  }

  async function handleSaveWhatsapp(e: React.FormEvent) {
    e.preventDefault();
    setSavingWhatsapp(true);
    try {
      const payload = { ...whatsapp, whatsappPhone: formatPhone(phone) || null };
      const updated = await api.put<NotificationSettings>('/notification-settings', payload);
      setWhatsapp({
        whatsappPhone: updated.whatsappPhone,
        whatsappOptIn: updated.whatsappOptIn,
        alertLowStock: updated.alertLowStock,
      });
      toast.success('WhatsApp actualizado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingWhatsapp(false);
    }
  }

  const isConnected = Boolean(whatsapp.whatsappPhone && whatsapp.whatsappOptIn);
  const visibleTabs = TABS.filter((t) => !t.ownerOnly || isOwner);

  function renderContent() {
    if (loading) return <SectionSkeleton />;

    if (activeTab === 'negocio') {
      return (
        <SectionLayout
          title="Mi negocio"
          description="Información básica de tu negocio dentro de Inventario360. Este nombre es visible para todo el equipo."
        >
          <Card className="p-6">
            <form onSubmit={(e) => void handleSaveName(e)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre del negocio</Label>
                <Input
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Nombre de tu negocio"
                  autoCapitalize="words"
                />
              </div>
              {businessType && (
                <div className="space-y-1.5">
                  <Label>Tipo de negocio</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm px-3 py-1.5 bg-muted rounded-lg text-muted-foreground font-medium">
                      {BUSINESS_TYPE_LABELS[businessType] ?? businessType}
                    </span>
                    <span className="text-xs text-muted-foreground">Configurado al iniciar</span>
                  </div>
                </div>
              )}
              <Button type="submit" disabled={savingName || !businessName.trim()}>
                {savingName ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>
          </Card>
        </SectionLayout>
      );
    }

    if (activeTab === 'modulos') {
      return (
        <SectionLayout
          title="Módulos del staff"
          description="Controlá a qué secciones tienen acceso los empleados. Los dueños siempre tienen acceso total independientemente de esta configuración."
        >
          <div className="space-y-4">
            <Card className="divide-y divide-border p-0 overflow-hidden">
              {MODULES.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{mod.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                  </div>
                  <Toggle checked={isModuleOn(mod.id)} onChange={() => toggleModule(mod.id)} />
                </div>
              ))}
            </Card>
            <Button onClick={() => void handleSaveModules()} disabled={savingModules}>
              {savingModules ? 'Guardando...' : 'Guardar módulos'}
            </Button>
          </div>
        </SectionLayout>
      );
    }

    if (activeTab === 'notificaciones') {
      return (
        <SectionLayout
          title="Notificaciones push"
          description="El equipo recibe una alerta en la app móvil cuando ocurre cada uno de estos eventos en tu negocio."
        >
          <div className="space-y-4">
            <Card className="divide-y divide-border p-0 overflow-hidden">
              {(
                [
                  {
                    key: 'alertNewSale',
                    label: 'Nueva venta registrada',
                    desc: 'Notifica a todos excepto quien realizó la venta',
                  },
                  {
                    key: 'alertTurnAssigned',
                    label: 'Turno asignado',
                    desc: 'Notifica al empleado asignado cuando otro le agrega un turno',
                  },
                  {
                    key: 'alertLowStock',
                    label: 'Stock bajo',
                    desc: 'Notifica cuando un producto baja del mínimo configurado',
                  },
                ] as { key: keyof PushNotifSettings; label: string; desc: string }[]
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    checked={push[key]}
                    onChange={(v) => setPush((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </Card>
            <Button onClick={() => void handleSavePush()} disabled={savingPush}>
              {savingPush ? 'Guardando...' : 'Guardar notificaciones'}
            </Button>
          </div>
        </SectionLayout>
      );
    }

    if (activeTab === 'whatsapp') {
      return (
        <SectionLayout
          title="WhatsApp"
          description="Recibí alertas importantes directo en tu WhatsApp. Requerimos tu consentimiento explícito según las políticas de Meta."
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <h3 className="text-sm font-medium text-foreground">Configuración de alertas</h3>
              {isConnected && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={11} /> Conectado
                </span>
              )}
            </div>
            <form onSubmit={(e) => void handleSaveWhatsapp(e)} className="space-y-5">
              <div className="space-y-1.5">
                <Label>Número de WhatsApp</Label>
                <PhoneInput value={phone} onChange={setPhone} placeholder="11 2345-6789" />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsapp.whatsappOptIn}
                  onChange={(e) => setWhatsapp({ ...whatsapp, whatsappOptIn: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    Acepto recibir alertas por WhatsApp
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Requerido por Meta. Solo recibirás notificaciones de Inventario360.
                  </p>
                </div>
              </label>
              {whatsapp.whatsappOptIn && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">Stock bajo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cuando un producto cae al mínimo configurado
                      </p>
                    </div>
                    <Toggle
                      checked={whatsapp.alertLowStock}
                      onChange={(v) => setWhatsapp({ ...whatsapp, alertLowStock: v })}
                    />
                  </div>
                </div>
              )}
              <Button type="submit" disabled={savingWhatsapp}>
                {savingWhatsapp ? 'Guardando...' : 'Guardar'}
              </Button>
            </form>
          </Card>
        </SectionLayout>
      );
    }

    if (activeTab === 'integraciones') {
      return (
        <SectionLayout
          title="Integraciones"
          description="Conectá Inventario360 con otras plataformas que usás en tu negocio. Más integraciones en camino."
        >
          <Card className="divide-y divide-border p-0 overflow-hidden">
            {OTHER_INTEGRATIONS.map((int) => (
              <div key={int.id} className="flex items-center gap-4 px-5 py-4 opacity-50">
                <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
                  <Puzzle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{int.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{int.description}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 bg-muted px-2.5 py-1 rounded-full font-medium">
                  Próximamente
                </span>
              </div>
            ))}
          </Card>
        </SectionLayout>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Administrá tu negocio e integraciones.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => goTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {renderContent()}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}
