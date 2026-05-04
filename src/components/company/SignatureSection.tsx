'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useRef, useState } from 'react';
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

export function SignatureSection({ standId }: { standId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);
  const supabase = createClient();

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleSign = async () => {
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
      const result = await signStandReception(standId, publicUrl);
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
          Al firmar, confirmas que has recibido el stand con todas las evidencias en el estado mostrado en las fotos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white w-full max-w-[600px] h-[200px]">
          <SignatureCanvas 
            ref={signatureRef}
            penColor="black"
            canvasProps={{ className: 'w-full h-full' }}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClear} disabled={isSubmitting}>
            Limpiar firma
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button className="bg-brand hover:bg-brand-hover text-white" disabled={isSubmitting}>
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
