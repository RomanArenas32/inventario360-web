'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react';

// ── CSV parser ────────────────────────────────────────────────────────────────

type ParsedRow = {
  name: string;
  code: string;
  costPrice?: number;
  salePrice?: number;
  stock?: number;
  minStock?: number;
  categoryName?: string;
  description?: string;
};

type ParseError = { line: number; error: string };

const COLUMN_ALIASES: Record<string, string> = {
  nombre: 'name',
  name: 'name',
  código: 'code',
  codigo: 'code',
  code: 'code',
  'precio costo': 'costPrice',
  precio_costo: 'costPrice',
  costo: 'costPrice',
  costprice: 'costPrice',
  'precio venta': 'salePrice',
  precio_venta: 'salePrice',
  venta: 'salePrice',
  saleprice: 'salePrice',
  stock: 'stock',
  'stock minimo': 'minStock',
  stock_minimo: 'minStock',
  'stock mínimo': 'minStock',
  minstock: 'minStock',
  categoria: 'categoryName',
  categoría: 'categoryName',
  category: 'categoryName',
  descripcion: 'description',
  descripción: 'description',
  description: 'description',
};

function parseCsv(text: string): { rows: ParsedRow[]; errors: ParseError[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2)
    return {
      rows: [],
      errors: [{ line: 1, error: 'El archivo está vacío o solo tiene encabezado' }],
    };

  const headers = lines[0]!.split(/[,;]/).map((h) => {
    const normalized = h.trim().toLowerCase().replace(/"/g, '');
    return COLUMN_ALIASES[normalized] ?? normalized;
  });

  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]!.split(/[,;]/).map((v) => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? '';
    });

    if (!obj.name || !obj.code) {
      errors.push({ line: i + 1, error: `Falta nombre o código` });
      continue;
    }

    const row: ParsedRow = {
      name: obj.name,
      code: obj.code,
    };

    if (obj.costPrice) row.costPrice = parseFloat(obj.costPrice.replace(',', '.')) || undefined;
    if (obj.salePrice) row.salePrice = parseFloat(obj.salePrice.replace(',', '.')) || undefined;
    if (obj.stock) row.stock = parseInt(obj.stock, 10) || 0;
    if (obj.minStock) row.minStock = parseInt(obj.minStock, 10) || 0;
    if (obj.categoryName) row.categoryName = obj.categoryName;
    if (obj.description) row.description = obj.description;

    rows.push(row);
  }

  return { rows, errors };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ImportResult = {
  created: number;
  updated: number;
  errors: { code: string; name: string; error: string }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

// ── Template CSV ──────────────────────────────────────────────────────────────

const TEMPLATE = `nombre,codigo,precio_costo,precio_venta,stock,stock_minimo,categoria,descripcion
Galletas Oreo 120g,7622210951656,800,1500,10,3,Almacén,
Yerba Mate 500g,7790387003605,2500,4000,5,2,Almacén,Yerba mate tradicional
Shampoo Sedal 200ml,7891150057486,1200,2200,8,2,Higiene,
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_productos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CsvImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setRows([]);
    setParseErrors([]);
    setFileName('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleFile(file: File) {
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows: parsed, errors } = parseCsv(text);
      setRows(parsed);
      setParseErrors(errors);
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFile(file);
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const res = await api.post<ImportResult>('/products/bulk-import', { products: rows });
      setResult(res);
      if (res.created > 0 || res.updated > 0) {
        toast.success(`${res.created} creados · ${res.updated} actualizados`);
        onSuccess();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
    }
  }

  const hasData = rows.length > 0;
  const hasResult = !!result;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Upload size={17} />
            Importar productos desde CSV
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              Columnas:{' '}
              <span className="font-mono">
                nombre, codigo, precio_costo, precio_venta, stock, stock_minimo, categoria,
                descripcion
              </span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs shrink-0 ml-3"
              onClick={downloadTemplate}
            >
              <Download size={12} />
              Plantilla
            </Button>
          </div>

          {/* Drop zone */}
          {!hasData && !hasResult && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl py-10 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <FileText size={32} className="text-muted-foreground/50" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {fileName || 'Arrastrá tu archivo CSV o hacé click'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Separado por comas o punto y coma
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          )}

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle size={13} />
                {parseErrors.length} fila{parseErrors.length !== 1 ? 's' : ''} con error de formato
                (se omitirán)
              </div>
              {parseErrors.slice(0, 3).map((e) => (
                <p key={e.line} className="text-xs text-amber-700 dark:text-amber-400">
                  Línea {e.line}: {e.error}
                </p>
              ))}
            </div>
          )}

          {/* Preview */}
          {hasData && !hasResult && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Vista previa — {rows.length} producto{rows.length !== 1 ? 's' : ''}
              </p>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                          Nombre
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                          Código
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-muted-foreground">
                          Costo
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-muted-foreground">
                          Venta
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-muted-foreground">
                          Stock
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                          Categoría
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium truncate max-w-[150px]">{r.name}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{r.code}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {r.costPrice != null ? `$${r.costPrice}` : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {r.salePrice != null ? `$${r.salePrice}` : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {r.stock ?? 0}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {r.categoryName || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2 border-t border-border">
                    y {rows.length - 50} más...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {hasResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 px-4 py-3">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-green-700">{result.created}</p>
                    <p className="text-xs text-green-600">Creados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 px-4 py-3">
                  <CheckCircle2 size={20} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-blue-700">{result.updated}</p>
                    <p className="text-xs text-blue-600">Actualizados</p>
                  </div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-3 py-2.5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
                    <XCircle size={13} />
                    {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''}
                  </div>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">
                      [{e.code}] {e.name}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
          {!hasResult ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={importing}>
                Cancelar
              </Button>
              {hasData && (
                <Button
                  onClick={() => void handleImport()}
                  disabled={importing || rows.length === 0}
                >
                  {importing
                    ? 'Importando...'
                    : `Importar ${rows.length} producto${rows.length !== 1 ? 's' : ''}`}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={reset}>
                Importar otro archivo
              </Button>
              <Button onClick={handleClose}>Cerrar</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
