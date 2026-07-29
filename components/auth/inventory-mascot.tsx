'use client';

import Image from 'next/image';

type InventoryMascotProps = {
  onRequestAccount: () => void;
};

export default function InventoryMascot({ onRequestAccount }: InventoryMascotProps) {
  return (
    <button
      type="button"
      onClick={onRequestAccount}
      aria-label="Solicitar una cuenta"
      className="group flex w-full max-w-[240px] flex-col items-center rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="mascot-float flex w-full flex-col items-center">
        <span className="relative mb-3 rounded-xl border border-border bg-popover px-4 py-2 text-center shadow-lg after:absolute after:left-1/2 after:top-full after:h-3 after:w-3 after:-translate-x-1/2 after:-translate-y-1/2 after:rotate-45 after:border-b after:border-r after:border-border after:bg-popover">
          <span className="block text-xs text-muted-foreground">¿No tenés cuenta?</span>
          <span className="mt-0.5 block text-sm font-semibold text-primary">Pedila acá</span>
        </span>

        <Image
          src="/images/inventario-mascot.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          sizes="(max-width: 640px) 180px, 240px"
          className="h-auto w-full drop-shadow-[0_12px_20px_rgba(37,99,235,0.28)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
        />
      </span>
    </button>
  );
}
