'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { completeReturn } from '@/app/home/(dashboard)/devolucion/actions';
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

export function ReturnUploadForm({ standId, elements }: { standId: string, elements: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const signatureRef = useRef<SignatureCanvas>(null);

  const completedCount = elements.filter(el => el.return_photo_url).length;
  const totalCount = elements.length;
  const isAllCompleted = completedCount === totalCount;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, elementId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const path = `stands/${standId}/return-${elementId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('stand-photos').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('stand-photos').getPublicUrl(path);
      
      const { error: updateError } = await supabase.from('stand_elements').update({ return_photo_url: publicUrl }).eq('id', elementId);
      if (updateError) throw updateError;

      toast.success('Foto subida exitosamente');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al subir', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleComplete = async () => {
    if (!name.trim() || !role.trim()) {
      toast.error('Datos incompletos', { description: 'Por favor ingresa tu nombre y cargo.' });
      return;
    }

    if (signatureRef.current?.isEmpty()) {
      toast.error('Firma requerida', { description: 'Por favor, firma en el recuadro antes de completar la devolución.' });
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
      const path = `stands/${standId}/return-signature-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('stand-photos').upload(path, blob, {
        contentType: 'image/png',
      });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('stand-photos').getPublicUrl(path);

      const result = await completeReturn(standId, publicUrl, name, role);
      if (result.error) throw new Error(result.error);
      
      toast.success('Devolución completada', { description: 'Gracias por participar en el evento.' });
      router.push('/home');
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progreso */}
      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="font-medium text-neutral-900">Progreso de devolución</h3>
            <p className="text-sm text-neutral-500">{completedCount} de {totalCount} evidencias fotografiadas</p>
          </div>
          <span className="text-2xl font-semibold text-brand">{progressPercent}%</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5">
          <div className="bg-brand h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Lista de evidencias */}
      <div className="space-y-4">
        {elements.map(el => (
          <div key={el.id} className={`flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-lg transition-colors ${el.return_photo_url ? 'border-green-200 bg-green-50/30' : 'border-neutral-200 bg-white'}`}>
            <div className="flex-1 flex items-center gap-4 w-full mb-4 sm:mb-0">
              {el.delivery_photo_url ? (
                <img src={el.delivery_photo_url} alt="Referencia" className="w-16 h-16 object-cover rounded-md border border-neutral-200" />
              ) : (
                <div className="w-16 h-16 bg-neutral-100 rounded-md border border-neutral-200 flex items-center justify-center text-[10px] text-neutral-400 text-center">Sin ref.</div>
              )}
              
              <div>
                <h4 className="font-medium text-neutral-900">{el.name}</h4>
                <p className="text-sm text-neutral-500">Cantidad: {el.quantity}</p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-4">
              {el.return_photo_url ? (
                <div className="flex items-center gap-3">
                  <img src={el.return_photo_url} alt="Devolución" className="w-16 h-16 object-cover rounded-md border border-green-200" />
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mb-1" />
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-neutral-500 hover:text-neutral-900" onClick={() => document.getElementById(`ret-${el.id}`)?.click()} disabled={isUploading}>
                      Cambiar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full sm:w-auto border-dashed border-2 hover:border-brand hover:text-brand" onClick={() => document.getElementById(`ret-${el.id}`)?.click()} disabled={isUploading}>
                  <Upload className="mr-2 h-4 w-4" /> Subir foto final
                </Button>
              )}
              <input id={`ret-${el.id}`} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e, el.id)} />
            </div>
          </div>
        ))}
      </div>

      {/* Sección de Firma */}
      <div className="bg-white p-6 rounded-lg border border-neutral-200 space-y-6">
        <h3 className="font-medium text-neutral-900 mb-2">Firma de devolución</h3>
        <p className="text-sm text-neutral-500">
          Por favor, completa tus datos y firma para confirmar la entrega del stand y las evidencias al equipo organizador.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre de quien entrega *</Label>
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
          <div className="border border-neutral-300 rounded-lg overflow-hidden bg-neutral-50 w-full max-w-[600px] h-[200px] relative">
            {!isAllCompleted && (
              <div className="absolute inset-0 z-10 bg-neutral-100/60 cursor-not-allowed" title="Sube todas las fotos primero" />
            )}
            <SignatureCanvas 
              ref={signatureRef}
              penColor="black"
              canvasProps={{ className: 'w-full h-full' }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleClear} disabled={isSubmitting || !isAllCompleted} className="mt-2">
            Limpiar firma
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <AlertDialog>
          <AlertDialogTrigger render={
            <Button size="lg" className="bg-brand hover:bg-brand-hover text-white w-full sm:w-auto" disabled={!isAllCompleted || isSubmitting || !name.trim() || !role.trim()}>
              Completar devolución
            </Button>
          } />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Completar devolución?</AlertDialogTitle>
              <AlertDialogDescription>
                Asegúrate de que las fotos reflejan el estado real de las evidencias al entregarlas. Una vez completado, el proceso se cerrará.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Revisar fotos</AlertDialogCancel>
              <AlertDialogAction onClick={handleComplete} disabled={isSubmitting} className="bg-brand hover:bg-brand-hover text-white">
                {isSubmitting ? 'Guardando...' : 'Confirmar devolución'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
