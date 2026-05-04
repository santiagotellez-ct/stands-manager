'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';
import { signStandReception } from '@/app/home/(dashboard)/stand/actions';
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

export function SignatureSection({ standId, checklistItems }: { standId: string, checklistItems?: any[] }) {
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
      toast.error('Datos incompletos', { description: 'Por favor ingresa tu nombre y cargo.' });
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
      const path = `stands/${standId}/signature-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('stand-photos').upload(path, blob, {
        contentType: 'image/png',
      });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('stand-photos').getPublicUrl(path);

      // Save in DB
      const result = await signStandReception(standId, publicUrl, name, role);
      if (result.error) throw new Error(result.error);

      toast.success('Recepción confirmada', { description: 'Gracias por firmar la recepción de tu stand.' });
      
    } catch (error: any) {
      toast.error('Error al guardar', { description: error.message });
      setIsSubmitting(false); // Only set false if error, otherwise it navigates/refreshes anyway
    }
  };

  return (
    <Card className="border-brand border-2">
      <CardHeader>
        <CardTitle>Confirmar recepción del stand</CardTitle>
        <p className="text-sm text-neutral-500">
          Al firmar, confirmas que has recibido el stand con todas las evidencias en el estado mostrado en las fotos y que todos los ítems del checklist están completos.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {checklistItems && checklistItems.length > 0 && checklistItems.some(i => !i.is_checked) && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-md text-sm">
            <strong>Atención:</strong> Faltan ítems por verificar en la sección "Elementos del stand". Debes marcarlos todos como completados antes de poder firmar la recepción.
          </div>
        )}

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
          <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white w-full max-w-[600px] h-[200px] relative">
            {(checklistItems && checklistItems.some(i => !i.is_checked)) && (
              <div className="absolute inset-0 z-10 bg-neutral-100/60 cursor-not-allowed" title="Completa el checklist primero" />
            )}
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
              <Button 
                className="bg-brand hover:bg-brand-hover text-white" 
                disabled={isSubmitting || !name.trim() || !role.trim() || (checklistItems && checklistItems.some(i => !i.is_checked))}
              >
                Confirmar recepción
              </Button>
            } />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar recepción?</AlertDialogTitle>
                <AlertDialogDescription>
                  Estás a punto de firmar y aceptar formalmente la entrega del stand y todas sus evidencias en el estado actual. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSign} disabled={isSubmitting} className="bg-brand hover:bg-brand-hover text-white">
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
