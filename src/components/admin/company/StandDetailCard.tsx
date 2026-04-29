'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
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
import { unassignStand, updateReturnDate } from '@/app/admin/(dashboard)/empresas/[id]/actions';

export function StandDetailCard({ companyId, stand, status, elements }: { companyId: string, stand: any, status: string, elements: any[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [returnDate, setReturnDate] = useState(stand.return_available_at ? new Date(stand.return_available_at).toISOString().slice(0, 16) : '');
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  const handleGeneralPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const path = `stands/${stand.id}/general-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('stand-photos').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('stand-photos').getPublicUrl(path);
      
      const { error: updateError } = await supabase.from('stands').update({ general_photo_url: publicUrl }).eq('id', stand.id);
      if (updateError) throw updateError;

      toast.success('Foto general subida');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al subir', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleElementPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, elementId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const path = `stands/${stand.id}/delivery-${elementId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('stand-photos').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('stand-photos').getPublicUrl(path);
      
      const { error: updateError } = await supabase.from('stand_elements').update({ delivery_photo_url: publicUrl }).eq('id', elementId);
      if (updateError) throw updateError;

      toast.success('Foto de entrega subida');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al subir', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateDate = async () => {
    setIsUpdatingDate(true);
    try {
      const result = await updateReturnDate(stand.id, companyId, returnDate);
      if (result.error) throw new Error(result.error);
      toast.success('Fecha de devolución actualizada');
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleUnassign = async () => {
    try {
      const result = await unassignStand(stand.id, companyId);
      if (result.error) throw new Error(result.error);
      toast.success('Stand desasignado');
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending_delivery': return <Badge variant="outline" className="text-neutral-500">Pendiente de entrega</Badge>;
      case 'delivered': return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Entregado / Firmado</Badge>;
      case 'awaiting_return': return <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Esperando devolución</Badge>;
      case 'returned': return <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Devuelto</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen del stand */}
      <Card className="bg-brand/5 border-brand/20">
        <CardContent className="pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-lg text-brand">{(stand.stand_types as any)?.name}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-neutral-600">
              Fecha de devolución: {stand.return_available_at ? format(new Date(stand.return_available_at), 'dd/MM/yyyy HH:mm') : 'No definida'}
            </p>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">Editar fecha de devolución</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Editar fecha de devolución</AlertDialogTitle>
                  <AlertDialogDescription>
                    Modifica la fecha a partir de la cual la empresa podrá realizar la devolución.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Input type="datetime-local" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUpdateDate} disabled={isUpdatingDate}>Guardar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" disabled={stand.signed_at !== null}>
                  Desasignar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Desasignar stand?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto borrará la instancia del stand y todos los elementos asociados para esta empresa. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUnassign} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Desasignar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Foto general */}
      <Card>
        <CardHeader>
          <CardTitle>Foto general de entrega</CardTitle>
        </CardHeader>
        <CardContent>
          {stand.general_photo_url ? (
            <div className="space-y-4">
              <img src={stand.general_photo_url} alt="Foto general" className="w-full max-w-md aspect-video object-cover rounded-lg border border-neutral-200" />
              <div className="flex gap-2 items-center">
                <Button type="button" variant="outline" onClick={() => document.getElementById('general-photo-upload')?.click()} disabled={isUploading}>
                  Cambiar foto
                </Button>
                <input id="general-photo-upload" type="file" accept="image/*" className="hidden" onChange={handleGeneralPhotoUpload} />
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center bg-neutral-50">
              <p className="text-sm text-neutral-500 mb-4">Sube la foto general de cómo entregaste el stand a la empresa.</p>
              <Button type="button" onClick={() => document.getElementById('general-photo-upload')?.click()} disabled={isUploading}>
                {isUploading ? 'Subiendo...' : 'Subir foto general'}
              </Button>
              <input id="general-photo-upload" type="file" accept="image/*" className="hidden" onChange={handleGeneralPhotoUpload} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recepción y firma */}
      <Card>
        <CardHeader>
          <CardTitle>Recepción de la empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {stand.signed_at ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              {stand.delivery_signature_url && (
                <div className="bg-white p-2 border border-neutral-200 rounded-md">
                  <img src={stand.delivery_signature_url} alt="Firma" className="h-20 object-contain" />
                </div>
              )}
              <div>
                <p className="font-medium text-neutral-900 mb-1">Stand recibido por la empresa</p>
                <p className="text-sm text-neutral-500">
                  Firmado el {format(new Date(stand.signed_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 italic">Pendiente de firma de recepción por la empresa.</p>
          )}
        </CardContent>
      </Card>

      {/* Devolución */}
      <Card>
        <CardHeader>
          <CardTitle>Devolución de la empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {stand.returned_at ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="font-medium text-green-900 mb-1">Stand devuelto</p>
              <p className="text-sm text-green-700">
                Devuelto el {format(new Date(stand.returned_at), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 italic">
              Devolución no completada. La empresa podrá completarla a partir del {stand.return_available_at ? format(new Date(stand.return_available_at), 'dd/MM/yyyy HH:mm') : 'la fecha definida'}.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Elementos */}
      <Card>
        <CardHeader>
          <CardTitle>Elementos del stand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {elements.map((el) => (
              <div key={el.id} className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-neutral-900">{el.name}</h4>
                    <p className="text-sm text-neutral-500">Cantidad: {el.quantity}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  {/* Foto Entrega (Admin) */}
                  <div className="space-y-2">
                    <Label className="text-xs text-neutral-500">Foto Entrega (Tú)</Label>
                    {el.delivery_photo_url ? (
                      <div className="relative group">
                        <img src={el.delivery_photo_url} alt="Entrega" className="w-full h-32 object-cover rounded-md border border-neutral-200" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                          <Button size="sm" variant="secondary" onClick={() => document.getElementById(`upload-del-${el.id}`)?.click()} disabled={isUploading}>Cambiar</Button>
                        </div>
                        <input id={`upload-del-${el.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleElementPhotoUpload(e, el.id)} />
                      </div>
                    ) : (
                      <div className="w-full h-32 border border-dashed border-neutral-300 rounded-md flex items-center justify-center bg-neutral-50">
                        <Button size="sm" variant="outline" onClick={() => document.getElementById(`upload-del-${el.id}`)?.click()} disabled={isUploading}>Subir foto</Button>
                        <input id={`upload-del-${el.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleElementPhotoUpload(e, el.id)} />
                      </div>
                    )}
                  </div>

                  {/* Foto Recepción (Empresa) */}
                  <div className="space-y-2">
                    <Label className="text-xs text-neutral-500">Foto Devolución (Empresa)</Label>
                    {el.return_photo_url ? (
                      <img src={el.return_photo_url} alt="Devolución" className="w-full h-32 object-cover rounded-md border border-neutral-200" />
                    ) : (
                      <div className="w-full h-32 border border-neutral-100 bg-neutral-50 rounded-md flex items-center justify-center text-center p-2">
                        <span className="text-xs text-neutral-400">Pendiente de devolución</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
