'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';
import { adminSignStandReception } from '@/app/admin/(dashboard)/empresas/[id]/actions';
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

export function AdminSignatureSection({ standId, companyId }: { standId: string; companyId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const signatureRef = useRef<SignatureCanvas>(null);
  const supabase = createClient();

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleSign = async () => {
    if (!name.trim() || !role.trim()) {
      toast.error('Datos incompletos', { description: 'Por favor ingresa el nombre y cargo de la persona.' });
      return;
    }

    if (signatureRef.current?.isEmpty()) {
      toast.error('Firma requerida', { description: 'Por favor, firma en el recuadro antes de confirmar.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get image as blob
      const canvas = signatureRef.current?.getTrimmedCanvas();
      if (!canvas) throw new Error('No se pudo obtener la firma');
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Error al procesar la firma');

      // Upload to storage
      const path = `stands/${standId}/admin-signature-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('stand-photos').upload(path, blob, {
        contentType: 'image/png',
      });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('stand-photos').getPublicUrl(path);

      // Save in DB via admin action
      const result = await adminSignStandReception(standId, publicUrl, companyId, name, role);
      if (result.error) throw new Error(result.error);

      toast.success('Recepción confirmada por admin', { description: 'La firma de recepción ha sido registrada.' });
      
    } catch (error: any) {
      toast.error('Error al guardar', { description: error.message });
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-amber-300 border-2 bg-amber-50/30">
      <CardHeader>
        <CardTitle>Firmar recepción (Admin)</CardTitle>
        <p className="text-sm text-neutral-500">
          Como administrador, puedes completar la firma de recepción en nombre de la empresa.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre de quien recibe *</Label>
            <Input 
              placeholder="Ej: Juan Pérez" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label>Cargo / Rol *</Label>
            <Input 
              placeholder="Ej: Coordinador de Marketing" 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Firma *</Label>
          <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white w-full max-w-[600px] h-[200px]">
            <SignatureCanvas 
              ref={signatureRef}
              penColor="black"
              canvasProps={{ className: 'w-full h-full' }}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClear} disabled={isSubmitting}>
            Limpiar firma
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" disabled={isSubmitting || !name.trim() || !role.trim()}>
                Confirmar recepción (Admin)
              </Button>
            } />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar recepción como admin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Estás firmando la recepción del stand en nombre de la empresa. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSign} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {isSubmitting ? 'Guardando...' : 'Sí, confirmar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
