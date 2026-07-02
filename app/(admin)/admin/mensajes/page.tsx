'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  isUser: boolean;
  notes: string | null;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',  color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400' },
  read:      { label: 'Leído',      color: 'bg-muted text-muted-foreground' },
  replied:   { label: 'Respondido', color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400' },
  snoozed:   { label: 'Pospuesto', color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400' },
  dismissed: { label: 'Descartado', color: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400' },
};

const STATUSES = Object.entries(STATUS_LABELS);

export default function MensajesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Message | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function load(status?: string) {
    setLoading(true);
    try {
      const path = status ? `/messages?status=${status}` : '/messages';
      const data = await api.get<Message[]>(path);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(filter || undefined);
  }, [filter]);

  function openMessage(msg: Message) {
    setSelected(msg);
    setNotes(msg.notes ?? '');
    // Marcar como leído automáticamente si está pendiente
    if (msg.status === 'pending') {
      void api.patch(`/messages/${msg.id}`, { status: 'read' }).then(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'read' } : m)),
        );
      });
    }
  }

  async function handleUpdate(id: string, patch: Partial<Message>) {
    setSaving(true);
    try {
      const updated = await api.patch<Message>(`/messages/${id}`, patch);
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setSelected(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    await api.delete(`/messages/${id}`);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
  }

  async function saveNotes() {
    if (!selected) return;
    await handleUpdate(selected.id, { notes });
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Lista */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mensajes</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Solicitudes de acceso y consultas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilter('')}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              filter === '' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          {STATUSES.map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                filter === key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No hay mensajes.</div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${
                    selected?.id === msg.id ? 'bg-muted/60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${msg.status === 'pending' ? 'text-foreground' : 'text-foreground/80'}`}>
                          {msg.name}
                        </span>
                        {msg.isUser && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                            Cliente
                          </span>
                        )}
                        {msg.status === 'pending' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{msg.message}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_LABELS[msg.status]?.color ?? ''}`}>
                        {STATUS_LABELS[msg.status]?.label}
                      </span>
                      <p className="text-xs text-muted-foreground/50 mt-1">
                        {new Date(msg.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel de detalle */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-card border border-border rounded-xl p-5 flex flex-col gap-4 self-start sticky top-0 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-foreground font-semibold">{selected.name}</h2>
              <p className="text-muted-foreground text-xs">{selected.email}</p>
              {selected.phone && <p className="text-muted-foreground text-xs">{selected.phone}</p>}
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
          </div>

          <div className="bg-muted rounded-lg p-3">
            <p className="text-foreground/80 text-sm leading-relaxed">{selected.message}</p>
          </div>

          {/* Estado */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Estado</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUSES.map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => void handleUpdate(selected.id, { status: key as Message['status'] })}
                  className={`text-xs font-medium py-1.5 px-2 rounded-lg transition-colors ${
                    selected.status === key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Es cliente */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">¿Es cliente?</span>
            <button
              onClick={() => void handleUpdate(selected.id, { isUser: !selected.isUser })}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                selected.isUser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {selected.isUser ? 'Sí' : 'No'}
            </button>
          </div>

          {/* Notas */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Notas internas</p>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Recordatorios, seguimiento..."
            />
            <button
              onClick={() => void saveNotes()}
              disabled={saving || notes === (selected.notes ?? '')}
              className="mt-1.5 w-full text-xs font-medium py-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-lg disabled:opacity-40 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar notas'}
            </button>
          </div>

          <button
            onClick={() => void handleDelete(selected.id)}
            className="text-xs text-destructive hover:opacity-80 transition-opacity text-center"
          >
            Eliminar mensaje
          </button>
        </div>
      )}
    </div>
  );
}
