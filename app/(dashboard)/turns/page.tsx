'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import TurnBlock from './_components/turn-block';
import { PageHeader } from '@/components/shared/page-header';

const morning = ['08:00', '09:00', '10:00', '11:00'];
const afternoon = ['16:00', '17:00', '18:00', '19:00'];

type TurnStatus = 'disponible' | 'reservado' | 'no_disponible';

const initialStatus: Record<string, TurnStatus> = {
  '08:00': 'disponible',
  '09:00': 'reservado',
  '10:00': 'disponible',
  '11:00': 'no_disponible',
  '16:00': 'disponible',
  '17:00': 'reservado',
  '18:00': 'disponible',
  '19:00': 'no_disponible',
};

export default function TurnsPage() {
  const [statusByHour, setStatusByHour] = useState<Record<string, TurnStatus>>(initialStatus);

  const toggleStatus = (time: string) => {
    setStatusByHour((prev) => {
      const current = prev[time];
      let nextStatus: TurnStatus = 'disponible';

      if (current === 'disponible') {
        nextStatus = 'reservado';
      } else if (current === 'reservado') {
        nextStatus = 'no_disponible';
      }

      return {
        ...prev,
        [time]: nextStatus,
      };
    });
  };

  return (
    <div>
      <PageHeader title="Turnos" description="Bloques de 1 hora — Mañana y Tarde" />

      <Card className="p-4 mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm">Reservado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm">No disponible</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Haz clic en un turno para alternar entre disponible y reservado.
        </p>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold mb-3">Mañana</h2>
          <div className="grid grid-cols-2 gap-3">
            {morning.map((h) => (
              <TurnBlock
                key={h}
                time={h}
                status={statusByHour[h]}
                onClick={() => toggleStatus(h)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Tarde</h2>
          <div className="grid grid-cols-2 gap-3">
            {afternoon.map((h) => (
              <TurnBlock
                key={h}
                time={h}
                status={statusByHour[h]}
                onClick={() => toggleStatus(h)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
