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

    // Check if username is already taken in public.users
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

    // Check if there's an orphaned auth user with this email (from a previous incomplete delete)
    // and clean it up before creating a new one
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const orphanedUser = existingAuthUsers?.users?.find(
      (u: any) => u.email === internalEmail
    );
    if (orphanedUser) {
      // Delete the orphaned auth user first
      await supabaseAdmin.auth.admin.deleteUser(orphanedUser.id);
    }

    // 1. Create user in auth with generated email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: data.password,
      email_confirm: true,
    });

    if (authError) {
      throw authError;
    }

    // 2. Create user in public.users
    const { error: insertError } = await supabaseAdmin.from('users').upsert({
      id: authData.user.id,
      email: data.email || internalEmail, // Use internal email if no real email provided
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
