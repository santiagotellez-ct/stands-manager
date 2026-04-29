'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function setupFirstAdmin(data: any) {
  try {
    // 1. Check if admin exists
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
      
    if (checkError) throw checkError;
    if (existingAdmins && existingAdmins.length > 0) {
      return { error: 'Ya existe un administrador en el sistema' };
    }

    // 2. Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // 3. Create user in public.users
    const { error: insertError } = await supabaseAdmin.from('users').upsert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: 'admin',
    });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
