'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Play,
  CheckCircle,
  XCircle,
  UserX,
  Pencil,
  Phone,
  Clock,
  User,
} from 'lucide-react';
import TurnFormModal from './_components/turn-form-modal';

// ── Types ────────────────────────────────────────────────────────────────────

type TurnStatus = 'pending' | 'in_progress' | 'done' | 'cancelled' | 'no_show';

type Turn = {
  id: string;
  clientName: string;
  clientPhone: string | null;
  service: string;
  startTime: string | null;
  date: string;
  duration: number;
  price: number | null;
  status: TurnStatus;
  notes: string | null;
  assignedUserId: string | null;
  assignedUser: { id: string; name: string } | null;
};

type Member = { userId: string; name: string; role: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(d: Date) {
  return d.toISOString().split('T')[0]!;
}

function formatDateLabel(dateKey: string) {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(isoOrNull: string | null) {
  if (!isoOrNull) return null;
  const d = new Date(isoOrNull);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatPrice(p: number | null) {
  if (p == null) return null;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(p);
}

const STATUS_META: Record<TurnStatus, { label: string; color: string }> = {
  pending: {
    label: 'Pendiente',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  in_progress: {
    label: 'En curso',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  done: {
    label: 'Finalizado',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  no_show: { label: 'No asistió', color: 'bg-muted text-muted-foreground' },
};

type FilterKey = 'all' | TurnStatus;

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TurnsSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-lg" />
          <div className="w-32 h-8 bg-muted rounded-lg" />
          <div className="w-8 h-8 bg-muted rounded-lg" />
          <div className="w-14 h-8 bg-muted rounded-lg ml-1" />
        </div>
        <div className="w-28 h-9 bg-muted rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-24 h-8 bg-muted rounded-full" />
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <div className="h-3 bg-muted rounded w-24" />
        <div className="h-6 bg-muted rounded w-48" />
        <div className="h-3 bg-muted rounded w-32" />
      </div>
      <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="w-12 h-12 bg-muted rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-40" />
              <div className="h-3 bg-muted rounded w-28" />
            </div>
            <div className="h-6 bg-muted rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hero card ─────────────────────────────────────────────────────────────────

function HeroCard({ turn }: { turn: Turn }) {
  const isActive = turn.status === 'in_progress';
  const time = formatTime(turn.startTime);

  return (
    <div
      className={`rounded-2xl p-5 space-y-2 ${
        isActive
          ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700'
          : 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}
      >
        {isActive ? 'En curso ahora' : 'Próximo turno'}
      </p>
      <p className="text-lg font-bold text-foreground">{turn.clientName}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{turn.service}</span>
        {time && (
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {time}
          </span>
        )}
        {turn.assignedUser && (
          <span className="flex items-center gap-1">
            <User size={13} />
            {turn.assignedUser.name}
          </span>
        )}
        {turn.price != null && (
          <span className="font-medium text-foreground">{formatPrice(turn.price)}</span>
        )}
      </div>
    </div>
  );
}

// ── Turn row ──────────────────────────────────────────────────────────────────

function TurnRow({
  turn,
  onAction,
  onEdit,
}: {
  turn: Turn;
  onAction: (id: string, status: TurnStatus) => void;
  onEdit: (turn: Turn) => void;
}) {
  const meta = STATUS_META[turn.status];
  const time = formatTime(turn.startTime);
  const price = formatPrice(turn.price);

  const whatsappUrl = turn.clientPhone
    ? `https://wa.me/${turn.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${turn.clientName}, te recordamos tu turno para ${turn.service}.`)}`
    : null;

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      {/* Time / queue badge */}
      <div className="w-12 h-12 rounded-xl bg-muted flex flex-col items-center justify-center shrink-0">
        {time ? (
          <>
            <span className="text-xs font-bold text-foreground leading-tight">
              {time.split(':')[0]}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {time.split(':')[1]}
            </span>
          </>
        ) : (
          <Clock size={16} className="text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{turn.clientName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {turn.service}
          {turn.assignedUser ? ` · ${turn.assignedUser.name}` : ''}
          {price ? ` · ${price}` : ''}
        </p>
      </div>

      {/* Status badge */}
      <Badge className={`shrink-0 text-xs border-0 ${meta.color}`}>{meta.label}</Badge>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {turn.status === 'pending' && (
            <DropdownMenuItem onClick={() => onAction(turn.id, 'in_progress')}>
              <Play size={14} className="mr-2 text-amber-500" />
              Iniciar
            </DropdownMenuItem>
          )}
          {(turn.status === 'pending' || turn.status === 'in_progress') && (
            <DropdownMenuItem onClick={() => onAction(turn.id, 'done')}>
              <CheckCircle size={14} className="mr-2 text-green-500" />
              Completar
            </DropdownMenuItem>
          )}
          {(turn.status === 'pending' || turn.status === 'in_progress') && (
            <DropdownMenuItem onClick={() => onAction(turn.id, 'no_show')}>
              <UserX size={14} className="mr-2 text-muted-foreground" />
              No se presentó
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onEdit(turn)}>
            <Pencil size={14} className="mr-2" />
            Editar
          </DropdownMenuItem>
          {whatsappUrl && (
            <DropdownMenuItem
              onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
            >
              <Phone size={14} className="mr-2 text-green-600" />
              WhatsApp
            </DropdownMenuItem>
          )}
          {turn.status !== 'cancelled' && turn.status !== 'done' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onAction(turn.id, 'cancelled')}
              >
                <XCircle size={14} className="mr-2" />
                Cancelar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TurnsPage() {
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [turns, setTurns] = useState<Turn[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTurn, setEditingTurn] = useState<Turn | null>(null);

  const loadTurns = useCallback(async (dk: string) => {
    setLoading(true);
    try {
      const data = await api.get<Turn[]>(`/turns?date=${dk}`);
      setTurns(Array.isArray(data) ? data : []);
    } catch {
      toast.error('No se pudieron cargar los turnos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTurns(dateKey);
  }, [dateKey, loadTurns]);

  useEffect(() => {
    void api
      .get<{ userId: string; name: string; role: string }[]>('/tenants/members')
      .then(setMembers)
      .catch(() => null);
  }, []);

  const navigate = (dir: -1 | 1) => {
    const d = new Date(dateKey + 'T12:00:00');
    d.setDate(d.getDate() + dir);
    setDateKey(toDateKey(d));
  };

  async function handleAction(id: string, status: TurnStatus) {
    // Optimistic update
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await api.patch(`/turns/${id}`, { status });
    } catch {
      toast.error('No se pudo actualizar el estado');
      void loadTurns(dateKey);
    }
  }

  function openNew() {
    setEditingTurn(null);
    setModalOpen(true);
  }

  function openEdit(turn: Turn) {
    setEditingTurn(turn);
    setModalOpen(true);
  }

  async function handleSave(payload: Record<string, unknown>) {
    try {
      if (editingTurn) {
        await api.patch(`/turns/${editingTurn.id}`, payload);
        toast.success('Turno actualizado');
      } else {
        await api.post('/turns', { ...payload, date: dateKey });
        toast.success('Turno creado');
      }
      setModalOpen(false);
      void loadTurns(dateKey);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const counts: Record<TurnStatus, number> = {
    pending: turns.filter((t) => t.status === 'pending').length,
    in_progress: turns.filter((t) => t.status === 'in_progress').length,
    done: turns.filter((t) => t.status === 'done').length,
    cancelled: turns.filter((t) => t.status === 'cancelled').length,
    no_show: turns.filter((t) => t.status === 'no_show').length,
  };

  const filtered = filter === 'all' ? turns : turns.filter((t) => t.status === filter);

  // Hero: first in_progress, else first pending sorted by startTime
  const heroTurn: Turn | null =
    turns.find((t) => t.status === 'in_progress') ??
    turns
      .filter((t) => t.status === 'pending')
      .sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      })[0] ??
    null;

  const isToday = dateKey === toDateKey(new Date());

  const FILTERS: { key: FilterKey; label: string; count?: number }[] = [
    { key: 'all', label: 'Todos', count: turns.length },
    { key: 'pending', label: 'Pendientes', count: counts.pending },
    { key: 'in_progress', label: 'En curso', count: counts.in_progress },
    { key: 'done', label: 'Finalizados', count: counts.done },
    { key: 'cancelled', label: 'Cancelados', count: counts.cancelled },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-[9rem] text-center capitalize">
            {formatDateLabel(dateKey)}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight size={16} />
          </Button>
          {!isToday && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 ml-1 text-xs"
              onClick={() => setDateKey(toDateKey(new Date()))}
            >
              Hoy
            </Button>
          )}
        </div>

        <Button size="sm" className="h-9 gap-1.5" onClick={openNew}>
          <Plus size={15} />
          Nuevo turno
        </Button>
      </div>

      {loading ? (
        <TurnsSkeleton />
      ) : (
        <>
          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.filter((f) => f.key === 'all' || (f.count ?? 0) > 0).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
                {(f.count ?? 0) > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      filter === f.key
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-background text-foreground'
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Hero card */}
          {heroTurn && filter === 'all' && <HeroCard turn={heroTurn} />}

          {/* Turn list */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border bg-card py-16 flex flex-col items-center gap-3 text-center">
              <Clock size={32} className="text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                {filter === 'all'
                  ? 'No hay turnos para este día'
                  : `No hay turnos ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}`}
              </p>
              {filter === 'all' && (
                <Button size="sm" className="mt-1 gap-1.5" onClick={openNew}>
                  <Plus size={14} />
                  Agregar turno
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border">
              {filtered.map((turn) => (
                <TurnRow key={turn.id} turn={turn} onAction={handleAction} onEdit={openEdit} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <TurnFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        turn={editingTurn}
        members={members}
        defaultDate={dateKey}
      />
    </div>
  );
}
