'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface StandElement {
  id: string;
  name: string;
  quantity: number;
  description?: string | null;
  notes?: string | null;
  delivery_photo_url?: string | null;
}

export function ElementDetailList({ elements }: { elements: StandElement[] }) {
  const [selected, setSelected] = useState<StandElement | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {elements.map((el) => (
          <Card
            key={el.id}
            className="flex flex-row overflow-hidden shadow-sm border-neutral-200 items-center p-3 gap-4 cursor-pointer hover:border-brand/40 hover:shadow-md transition-all"
            onClick={() => setSelected(el)}
          >
            {el.delivery_photo_url ? (
              <div className="w-32 md:w-48 shrink-0 aspect-video bg-neutral-100 rounded-md overflow-hidden">
                <img src={el.delivery_photo_url} alt={el.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-32 md:w-48 shrink-0 aspect-video bg-neutral-100 rounded-md flex items-center justify-center text-xs text-neutral-400">
                Sin foto
              </div>
            )}
            <div className="flex-1 flex flex-col justify-center">
              <h4 className="font-semibold text-base md:text-lg">{el.name}</h4>
              <p className="text-sm text-neutral-600 mb-1">Cantidad: {el.quantity}</p>
              {el.description && <p className="text-sm text-neutral-500 italic line-clamp-1">{el.description}</p>}
              {el.notes && <p className="text-sm text-neutral-500 italic line-clamp-1">"{el.notes}"</p>}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              Cantidad: {selected?.quantity}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {selected?.delivery_photo_url ? (
              <div className="w-full rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
                <img
                  src={selected.delivery_photo_url}
                  alt={selected.name}
                  className="w-full max-h-[400px] object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400">
                Sin foto de referencia
              </div>
            )}
            {selected?.description && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1">Descripción</p>
                <p className="text-sm text-neutral-600">{selected.description}</p>
              </div>
            )}
            {selected?.notes && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1">Notas</p>
                <p className="text-sm text-neutral-500 italic">"{selected.notes}"</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
