'use client';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { createCompany } from './actions';

const newCompanySchema = z.object({
  name: z.string().min(2, 'El nombre/usuario debe tener al menos 2 caracteres'),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type NewCompanyFormValues = z.infer<typeof newCompanySchema>;

export default function NewCompanyPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewCompanyFormValues>({
    resolver: zodResolver(newCompanySchema) as any,
  });

  const onSubmit = async (data: NewCompanyFormValues) => {
    setIsLoading(true);
    try {
      const result = await createCompany(data);

      if (result.error) {
        toast.error('Error al crear', { description: result.error });
        return;
      }

      toast.success('Empresa creada exitosamente', { description: 'Ahora puedes asignarle un stand.' });
      router.push(`/admin/empresas/${result.id}`);
    } catch (error: any) {
      toast.error('Error', { description: 'Ha ocurrido un error inesperado' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-12">
      <PageHeader 
        title="Nueva empresa" 
        description="Registra una nueva empresa participante"
        action={
          <Button variant="outline" onClick={() => router.push('/admin/empresas')}>
            Volver
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre / Usuario de la empresa *</Label>
              <Input id="name" placeholder="Ej: TechCorp" {...register('name')} />
              <p className="text-xs text-neutral-500">Este será el nombre de usuario para iniciar sesión. Debe ser único.</p>
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico (opcional)</Label>
              <Input id="email" type="email" placeholder="empresa@ejemplo.com" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="password">Contraseña inicial *</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...register('password')} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
              <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" className="bg-brand hover:bg-brand-hover text-white" disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear empresa'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
