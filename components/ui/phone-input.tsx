'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const COUNTRIES = [
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+51', flag: '🇵🇪', name: 'Perú' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];

export interface PhoneValue {
  countryCode: CountryCode;
  number: string;
}

/** Splits a full phone string (e.g. "+541234567890") into { countryCode, number }. */
export function parsePhone(raw: string): PhoneValue {
  const matched = COUNTRIES.find((c) => raw.startsWith(c.code));
  return {
    countryCode: (matched?.code ?? '+54') as CountryCode,
    number: matched ? raw.slice(matched.code.length) : raw,
  };
}

/** Joins countryCode + number into a single string for storage. */
export function formatPhone(value: PhoneValue): string {
  return value.number ? `${value.countryCode}${value.number}` : '';
}

interface PhoneInputProps {
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = 'Número de teléfono',
}: PhoneInputProps) {
  const selected = COUNTRIES.find((c) => c.code === value.countryCode) ?? COUNTRIES[0];

  return (
    <div className="flex items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 pl-3 pr-2 py-2 text-sm hover:bg-muted/50 rounded-l-md transition-colors focus:outline-none shrink-0">
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-xs font-mono text-muted-foreground">{selected.code}</span>
          <ChevronDown size={11} className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {COUNTRIES.map((c) => (
            <DropdownMenuItem
              key={c.code}
              onSelect={() => onChange({ ...value, countryCode: c.code })}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base">{c.flag}</span>
              <span className="flex-1 text-sm">{c.name}</span>
              <span className="text-xs font-mono text-muted-foreground">{c.code}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="w-px h-5 bg-border shrink-0" />
      <input
        type="tel"
        placeholder={placeholder}
        value={value.number}
        onChange={(e) => onChange({ ...value, number: e.target.value })}
        className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
