'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Member = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
  isActive: boolean;
  joinedAt: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: 'owner' | 'staff';
};

const EMPTY: FormState = { name: '', email: '', password: '', role: 'staff' };

const ROLE_LABEL: Record<string, string> = { owner: 'Dueño', staff: 'Empleado' };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [changingRole, setChangingRole] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Member[]>('/tenants/members');
      setMembers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openAdd() {
    setForm(EMPTY);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/tenants/members', form);
      setShowForm(false);
      void load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al agregar miembro');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(userId: string, role: 'owner' | 'staff') {
    setChangingRole(userId);
    try {
      await api.patch(`/tenants/members/${userId}`, { role });
      void load();
    } finally {
      setChangingRole(null);
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`¿Eliminar a ${name} del equipo?`)) return;
    await api.delete(`/tenants/members/${userId}`);
    void load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
          <p className="text-muted-foreground mt-1">
            {members.length} miembro{members.length !== 1 ? 's' : ''} en este negocio
          </p>
        </div>
        <Button onClick={openAdd}>+ Agregar miembro</Button>
      </div>

      <Card className="p-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No hay miembros. Agregá el primero.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent">
                <TableHead className="px-4 py-3 text-muted-foreground">Nombre</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Email</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Rol</TableHead>
                <TableHead className="px-4 py-3 text-muted-foreground">Estado</TableHead>
                <TableHead className="px-4 py-3 text-right text-muted-foreground">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.membershipId}>
                  <TableCell className="px-4 py-3 font-medium text-foreground">{m.name}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground text-sm">
                    {m.email}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Select
                      value={m.role}
                      onValueChange={(val) =>
                        void handleRoleChange(m.userId, val as 'owner' | 'staff')
                      }
                      disabled={changingRole === m.userId}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Dueño</SelectItem>
                        <SelectItem value="staff">Empleado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      className={
                        m.isActive
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-0'
                          : 'bg-muted text-muted-foreground border-0'
                      }
                    >
                      {m.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleRemove(m.userId, m.name)}
                      className="h-auto p-0 text-xs text-destructive hover:opacity-80 hover:bg-transparent"
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar miembro</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Nombre *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Email *</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Contraseña *</Label>
              <Input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Rol</Label>
              <Select
                value={form.role}
                onValueChange={(val) => setForm({ ...form, role: val as 'owner' | 'staff' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Guardando...' : 'Agregar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
