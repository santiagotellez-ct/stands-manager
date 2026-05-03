'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

function usernameToEmail(username: string): string {
  // Generate a deterministic internal email from username
  const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${sanitized}@stands.internal`;
}

export async function createCompany(data: any) {
  try {
    const username = data.name.trim();

    // Check if username is already taken
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'company')
      .ilike('name', username)
      .maybeSingle();

    if (existing) {
      return { error: 'Ya existe una empresa con ese nombre/usuario.' };
    }

    // Generate internal email from username
    const internalEmail = usernameToEmail(username);

    // 1. Create user in auth with generated email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: data.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        return { error: 'Ya existe una empresa con ese nombre/usuario.' };
      }
      throw authError;
    }

    // 2. Create user in public.users
    const { error: insertError } = await supabaseAdmin.from('users').upsert({
      id: authData.user.id,
      email: data.email || null, // Optional real email
      name: username,
      role: 'company',
    });

    if (insertError) throw insertError;

    revalidatePath('/admin/empresas');
    return { success: true, id: authData.user.id };
  } catch (error: any) {
    return { error: error.message };
  }
}
