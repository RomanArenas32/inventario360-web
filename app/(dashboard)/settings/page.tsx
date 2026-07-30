'use client';

import { Card } from '@/components/ui/card';
import { ChevronRight, Puzzle } from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'Procesá pagos y sincronizá ventas automáticamente.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Enviá notificaciones y confirmaciones a tus clientes.',
  },
  {
    id: 'tiendanube',
    name: 'Tiendanube',
    description: 'Sincronizá el stock con tu tienda online.',
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integraciones</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Conectá tu negocio con otras plataformas.
        </p>
      </div>

      <Card className="divide-y divide-border p-0 overflow-hidden shadow-sm">
        {INTEGRATIONS.map((int) => (
          <div key={int.id} className="flex items-center gap-4 px-5 py-4 opacity-60">
            <div className="p-2 rounded-lg shrink-0 bg-muted text-muted-foreground">
              <Puzzle size={16} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{int.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{int.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Próximamente
              </span>
              <ChevronRight size={14} className="text-muted-foreground/40" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
