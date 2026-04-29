'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function DeleteStandTypeButton({ id, standsCount }: { id: string; standsCount: number }) {
  const router = useRouter();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (standsCount > 0) {
      toast.error('No se puede eliminar', { 
        description: `Hay ${standsCount} empresas con un stand de este tipo. Reasigna o elimina esos stands primero.` 
      });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('stand_types').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Tipo de stand eliminado');
      router.push('/admin/tipos-stand');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al eliminar', { description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  if (standsCount > 0) {
    return (
      <Button variant="destructive" onClick={handleDelete}>
        <Trash2 className="mr-2 h-4 w-4" /> Eliminar tipo de stand
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar tipo de stand
        </Button>
      } />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente este tipo de stand y todos sus elementos plantilla.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
