'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { saveStandType } from '@/app/admin/(dashboard)/tipos-stand/actions';

const elementSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.coerce.number().min(1, 'Debe ser al menos 1'),
  description: z.string().nullable().optional(),
  default_delivery_photo_url: z.string().nullable().optional(),
});

const checklistSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().nullable().optional(),
});

const standTypeSchema = z.object({
  name: z.string().min(2, 'Requerido'),
  description: z.string().nullable().optional(),
  default_return_available_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  default_general_photo_url: z.string().nullable().optional(),
  elements: z.array(elementSchema).min(1, 'Agrega al menos una evidencia'),
  checklist: z.array(checklistSchema).optional(),
});

type StandTypeFormValues = z.infer<typeof standTypeSchema>;

interface StandTypeFormProps {
  initialData?: StandTypeFormValues & { id?: string };
}

export function StandTypeForm({ initialData }: StandTypeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StandTypeFormValues>({
    resolver: zodResolver(standTypeSchema) as any,
    defaultValues: initialData || {
      name: '',
      description: '',
      notes: '',
      elements: [{ name: '', quantity: 1, description: '' }],
      checklist: [{ title: '', description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'elements',
    keyName: 'fieldId', // Prevents React Hook Form from overwriting the DB 'id' field
  });

  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } = useFieldArray({
    control,
    name: 'checklist',
    keyName: 'fieldId',
  });

  const generalPhoto = watch('default_general_photo_url');

  const handleGeneralPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const path = `stand-types/temp/general-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('stand-photos').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('stand-photos').getPublicUrl(path);
      setValue('default_general_photo_url', publicUrl);
      toast.success('Foto referencial subida');
    } catch (error: any) {
      toast.error('Error al subir foto', { description: error.message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSubmit = async (data: StandTypeFormValues) => {
    setIsLoading(true);
    try {
      const result = await saveStandType(initialData?.id, data);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(initialData?.id ? 'Tipo de stand actualizado y sincronizado' : 'Tipo de stand creado exitosamente');
      router.push('/admin/tipos-stand');
      router.refresh();
    } catch (error: any) {
      toast.error('Error al guardar', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Información principal */}
      <Card>
        <CardHeader>
          <CardTitle>Información del tipo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la plantilla *</Label>
              <Input id="name" {...register('name')} placeholder="Ej: Stand Premium 3x3" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_return_available_at">Fecha de devolución sugerida</Label>
              <Input id="default_return_available_at" type="datetime-local" {...register('default_return_available_at')} />
              <p className="text-xs text-neutral-500">Opcional. Se usará por defecto al asignar a una empresa.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register('description')} placeholder="Breve descripción del tipo de stand" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Notas solo visibles para administradores" />
          </div>
        </CardContent>
      </Card>

      {/* Foto general referencial */}
      <Card>
        <CardHeader>
          <CardTitle>Foto general referencial</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 mb-4">
            Foto referencial. Cada empresa tendrá su propia foto general que deberás subir al momento de asignarle el stand.
          </p>
          {generalPhoto ? (
            <div className="space-y-4">
              <img src={generalPhoto} alt="Foto general" className="w-full max-w-md aspect-video object-cover rounded-lg border border-neutral-200" />
              <Button type="button" variant="outline" onClick={() => setValue('default_general_photo_url', '')}>
                Cambiar foto
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input type="file" accept="image/*" onChange={handleGeneralPhotoUpload} disabled={uploadingPhoto} />
              {uploadingPhoto && <p className="text-sm text-neutral-500">Subiendo...</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evidencias plantilla */}
      <Card>
        <CardHeader>
          <CardTitle>Evidencias del stand</CardTitle>
          <p className="text-sm text-neutral-500">Define las evidencias que se entregarán con este tipo de stand.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.fieldId} className="p-4 border border-neutral-200 rounded-lg flex items-start gap-4">
              <input type="hidden" {...register(`elements.${index}.id`)} />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la evidencia *</Label>
                  <Input {...register(`elements.${index}.name`)} placeholder="Ej: Mesa, Silla, Pantalla" />
                  {errors.elements?.[index]?.name && <p className="text-sm text-destructive">{errors.elements[index]?.name?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Cantidad *</Label>
                  <Input type="number" {...register(`elements.${index}.quantity`)} min="1" />
                  {errors.elements?.[index]?.quantity && <p className="text-sm text-destructive">{errors.elements[index]?.quantity?.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descripción (opcional)</Label>
                  <Input {...register(`elements.${index}.description`)} placeholder="Detalles de la evidencia" />
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 mt-6">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {errors.elements?.root && <p className="text-sm text-destructive">{errors.elements.root.message}</p>}
          <Button type="button" variant="outline" onClick={() => append({ name: '', quantity: 1, description: '' })}>
            <Plus className="mr-2 h-4 w-4" /> Agregar evidencia
          </Button>
        </CardContent>
      </Card>

      {/* Checklist plantilla */}
      <Card>
        <CardHeader>
          <CardTitle>Elementos del stand (Checklist)</CardTitle>
          <p className="text-sm text-neutral-500">Define los ítems del stand que se podrán marcar como completados.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistFields.map((field, index) => (
            <div key={field.fieldId} className="flex items-start gap-4 p-4 border border-neutral-200 rounded-lg">
              <input type="hidden" {...register(`checklist.${index}.id`)} />
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input {...register(`checklist.${index}.title`)} placeholder="Ej: Estructura instalada" />
                  {errors.checklist?.[index]?.title && <p className="text-sm text-destructive mt-1">{errors.checklist[index]?.title?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Descripción (opcional)</Label>
                  <Textarea {...register(`checklist.${index}.description`)} placeholder="Detalles o instrucciones adicionales para este ítem" rows={2} />
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeChecklist(index)} className="text-destructive hover:bg-destructive/10 mt-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => appendChecklist({ title: '', description: '' })}>
            <Plus className="mr-2 h-4 w-4" /> Agregar elemento (ítem de checklist)
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-brand hover:bg-brand-hover text-white" disabled={isLoading}>
          {isLoading ? (initialData?.id ? 'Guardando...' : 'Creando...') : (initialData?.id ? 'Guardar cambios' : 'Crear stand')}
        </Button>
      </div>
    </form>
  );
}
