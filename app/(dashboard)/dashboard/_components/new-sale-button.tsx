'use client';

import { useState } from 'react';
import { NewSaleDialog } from '../../sales/_components/new-sale-dialog';

export function NewSaleButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
      >
        + Nueva venta
      </button>

      <NewSaleDialog open={open} onOpenChange={setOpen} onSuccess={() => setOpen(false)} />
    </>
  );
}
