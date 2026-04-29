'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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
import { deleteCompany } from '@/app/admin/(dashboard)/empresas/[id]/actions';

export function DeleteCompanySection({ company }: { company: any }) {
  const router = useRouter();
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmName !== company.name) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteCompany(company.id);
      if (result.error) throw new Error(result.error);
      
      toast.success('Empresa eliminada');
      router.push('/admin/empresas');
    } catch (error: any) {
      toast.error('Error al eliminar', { description: error.message });
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="text-red-800">Zona peligrosa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-medium text-neutral-900">Eliminar empresa</h4>
            <p className="text-sm text-neutral-500">
              Esta acción borrará la empresa y todas las fotos y stands asignados en cascada.
            </p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar empresa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la empresa y su stand instanciado.
                  Para confirmar, escribe el nombre de la empresa: <span className="font-bold text-neutral-900">{company.name}</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Input 
                  value={confirmName} 
                  onChange={(e) => setConfirmName(e.target.value)} 
                  placeholder={company.name}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmName('')}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  disabled={isDeleting || confirmName !== company.name}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
