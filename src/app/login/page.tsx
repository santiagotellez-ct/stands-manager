'use client';

import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { loginWithUsername } from './actions';

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema) as any,
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Get the internal email for this username via server action
      const result = await loginWithUsername(data.username);
      
      if (result.error) {
        toast.error('Error al iniciar sesión', { description: result.error });
        setIsLoading(false);
        return;
      }

      // Sign in with the internal email
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: result.email!,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', authData.user.id).single();
        if (profile?.role === 'company') {
          router.push('/home');
          router.refresh();
        } else {
          await supabase.auth.signOut();
          toast.error('Acceso denegado', { description: 'Estas credenciales no pertenecen a una empresa.' });
        }
      }
    } catch (error: any) {
      toast.error('Error al iniciar sesión', { description: 'Usuario o contraseña incorrectos' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Accede a tu panel de stand">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Usuario (nombre de empresa)</Label>
          <Input id="username" type="text" placeholder="Nombre de empresa" {...register('username')} />
          {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
        </div>
        <div className="space-y-2 relative">
          <Label htmlFor="password">Contraseña</Label>
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
        <Button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white" disabled={isLoading}>
          {isLoading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
    </AuthLayout>
  );
}
