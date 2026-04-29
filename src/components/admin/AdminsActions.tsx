'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { deleteAdmin } from '@/app/admin/(dashboard)/admins/actions';
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

export function AdminsActions({ admin, totalAdmins }: { admin: any; totalAdmins: number }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, [supabase]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAdmin(admin.id);
      if (result.error) throw new Error(result.error);
      toast.success('Admin eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar', { description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const isSelf = currentUserId === admin.id;
  const isLast = totalAdmins <= 1;
  const disabled = isSelf || isLast;
  
  let tooltipMessage = '';
  if (isSelf) tooltipMessage = 'No puedes eliminarte a ti mismo.';
  else if (isLast) tooltipMessage = 'No puedes eliminar al único administrador.';

  return (
    <div title={tooltipMessage}>
      <AlertDialog>
        <AlertDialogTrigger render={
          <Button variant="ghost" size="sm" disabled={disabled} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        } />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción revocará el acceso de {admin.name} ({admin.email}) al panel de administración.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
