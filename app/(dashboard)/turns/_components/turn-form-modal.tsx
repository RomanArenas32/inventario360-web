'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Clock, DollarSign } from 'lucide-react';

type Turn = {
  id: string;
  clientName: string;
  clientPhone: string | null;
  service: string;
  startTime: string | null;
  date: string;
  duration: number;
  price: number | null;
  notes: string | null;
  assignedUserId: string | null;
};

type Member = { userId: string; name: string; role: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  turn: Turn | null;
  members: Member[];
  defaultDate: string;
};

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1 h 30 min' },
  { value: '120', label: '2 horas' },
];

function toLocalDatetimeValue(isoOrNull: string | null, dateKey: string): string {
  if (isoOrNull) {
    const d = new Date(isoOrNull);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${dateKey}T09:00`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export default function TurnFormModal({
  open,
  onClose,
  onSave,
  turn,
  members,
  defaultDate,
}: Props) {
  const isEdit = !!turn;

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [service, setService] = useState('');
  const [startTime, setStartTime] = useState('');
  const [hasTime, setHasTime] = useState(true);
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [saving, setSaving] = useState(false);

  // Tracks which turn (by id) or 'new' was last initialized.
  // For new turns we only initialize once so closing accidentally doesn't wipe the form.
  // For edit turns we always reload the original data when the target turn changes.
  const lastInitKey = useRef<string>('');

  useEffect(() => {
    if (!open) return;

    const key = turn ? `edit:${turn.id}` : 'new';

    // New turn: preserve form data between accidental closes
    if (key === 'new' && lastInitKey.current === 'new') return;

    lastInitKey.current = key;

    if (turn) {
      setClientName(turn.clientName);
      setClientPhone(turn.clientPhone ?? '');
      setService(turn.service);
      setHasTime(!!turn.startTime);
      setStartTime(toLocalDatetimeValue(turn.startTime, turn.date));
      setDuration(String(turn.duration));
      setPrice(turn.price != null ? String(turn.price) : '');
      setNotes(turn.notes ?? '');
      setAssignedUserId(turn.assignedUserId ?? '');
    } else {
      setClientName('');
      setClientPhone('');
      setService('');
      setHasTime(true);
      setStartTime(`${defaultDate}T09:00`);
      setDuration('30');
      setPrice('');
      setNotes('');
      setAssignedUserId('');
    }
  }, [open, turn, defaultDate]);

  // Reset the "new" key after a successful save so the next new turn starts fresh
  function resetNewKey() {
    lastInitKey.current = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || null,
        service: service.trim(),
        startTime: hasTime ? new Date(startTime).toISOString() : null,
        duration: parseInt(duration, 10),
        price: price !== '' ? parseFloat(price) : null,
        notes: notes.trim() || null,
        assignedUserId: assignedUserId || null,
      };
      if (!hasTime) payload.date = defaultDate;
      await onSave(payload);
      resetNewKey();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base">{isEdit ? 'Editar turno' : 'Nuevo turno'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
            {/* ── Cliente ───────────────────────────────────────────── */}
            <div className="space-y-3">
              <SectionLabel>Cliente</SectionLabel>
              <FieldRow>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre *</Label>
                  <Input
                    required
                    autoFocus
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Teléfono</Label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+54 9 11 ..."
                    type="tel"
                  />
                </div>
              </FieldRow>
              <div className="space-y-1.5">
                <Label className="text-xs">Servicio *</Label>
                <Input
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Ej: Corte de cabello"
                />
              </div>
            </div>

            {/* ── Horario ───────────────────────────────────────────── */}
            <div className="space-y-3">
              <SectionLabel>Horario</SectionLabel>

              {/* Has time toggle — pill style */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHasTime(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    hasTime
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30'
                  }`}
                >
                  <Clock size={12} />
                  Hora fija
                </button>
                <button
                  type="button"
                  onClick={() => setHasTime(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    !hasTime
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-border hover:border-foreground/30'
                  }`}
                >
                  Sin hora (cola)
                </button>
              </div>

              <FieldRow>
                {hasTime ? (
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Fecha y hora *</Label>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                      El turno se agregará a la cola del día seleccionado sin hora específica.
                    </p>
                  </div>
                )}
              </FieldRow>

              <FieldRow>
                <div className="space-y-1.5">
                  <Label className="text-xs">Duración *</Label>
                  <Select value={duration} onValueChange={(v) => setDuration(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Precio</Label>
                  <div className="relative">
                    <DollarSign
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      className="pl-8"
                    />
                  </div>
                </div>
              </FieldRow>
            </div>

            {/* ── Asignación ────────────────────────────────────────── */}
            {members.length > 0 && (
              <div className="space-y-3">
                <SectionLabel>Asignación</SectionLabel>
                <div className="space-y-1.5">
                  <Label className="text-xs">Profesional</Label>
                  <Select value={assignedUserId} onValueChange={(v) => setAssignedUserId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <User size={13} />
                          Sin asignar
                        </span>
                      </SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.userId} value={m.userId}>
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                              {m.name.charAt(0).toUpperCase()}
                            </span>
                            {m.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ── Notas ────────────────────────────────────────────── */}
            <div className="space-y-3">
              <SectionLabel>Notas</SectionLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones, indicaciones especiales..."
                className="resize-none text-sm"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear turno'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
