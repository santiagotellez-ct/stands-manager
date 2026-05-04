'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toggleChecklistItem } from '@/app/home/(dashboard)/stand/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ChecklistItem {
  id: string;
  stand_id: string;
  title: string;
  is_checked: boolean;
  sort_order: number;
}

export function ChecklistSection({ items, standId, readOnly = false }: { items: ChecklistItem[], standId: string, readOnly?: boolean }) {
  const router = useRouter();
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  const handleToggle = async (id: string, checked: boolean) => {
    if (readOnly) return;
    
    setLoadingItems(prev => ({ ...prev, [id]: true }));
    try {
      const res = await toggleChecklistItem(id, checked, standId);
      if (res.error) throw new Error(res.error);
      router.refresh();
    } catch (err: any) {
      toast.error('Error al actualizar', { description: err.message });
    } finally {
      setLoadingItems(prev => ({ ...prev, [id]: false }));
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <h3 className="text-xl font-semibold mb-4">Elementos del stand</h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${item.is_checked ? 'bg-green-50/50 border-green-200' : 'bg-neutral-50/50 border-neutral-200'}`}>
            <Checkbox 
              id={`check-${item.id}`} 
              checked={item.is_checked} 
              disabled={loadingItems[item.id] || readOnly}
              onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)} 
            />
            <Label htmlFor={`check-${item.id}`} className={`flex-1 ${!readOnly && !loadingItems[item.id] ? 'cursor-pointer' : ''} text-sm font-medium ${item.is_checked ? 'text-neutral-500 line-through' : 'text-neutral-900'}`}>
              {item.title}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
