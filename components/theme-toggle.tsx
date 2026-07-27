'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle({
  className,
  hideLabel,
  iconSize = 16,
}: {
  className?: string;
  hideLabel?: boolean;
  iconSize?: number;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark
        ? <Sun size={iconSize} style={{ width: iconSize, height: iconSize }} />
        : <Moon size={iconSize} style={{ width: iconSize, height: iconSize }} />
      }
      {!hideLabel && <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>}
    </Button>
  );
}
