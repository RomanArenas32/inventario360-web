import { ThemeToggle } from '@/components/theme-toggle';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

export default function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* Columna izquierda — imagen */}
      <div className="relative hidden lg:block overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/dashboard.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8">
          <p className="text-white text-xl font-semibold leading-snug">
            Gestioná tus recursos de forma simple y rápida.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Inventario360 — para comercios de diferentes rubros.
          </p>
        </div>
      </div>

      {/* Columna derecha — contenido */}
      <div className="flex items-center justify-center p-8 bg-background relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors" />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
