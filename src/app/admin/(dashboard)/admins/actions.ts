'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createAdmin(data: any) {
  try {
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

    const { error: insertError } = await supabaseAdmin.from('users').upsert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: 'admin',
    });

    if (insertError) throw insertError;

    revalidatePath('/admin/admins');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteAdmin(id: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    
    revalidatePath('/admin/admins');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
