'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createCompany(data: any) {
  try {
    // 1. Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        return { error: 'El correo ya está registrado.' };
      }
      throw authError;
    }

    // 2. Create user in public.users
    const { error: insertError } = await supabaseAdmin.from('users').upsert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: 'company',
    });

    if (insertError) throw insertError;

    revalidatePath('/admin/empresas');
    return { success: true, id: authData.user.id };
  } catch (error: any) {
    return { error: error.message };
  }
}
