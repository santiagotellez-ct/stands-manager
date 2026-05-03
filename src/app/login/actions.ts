'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

function usernameToEmail(username: string): string {
  const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${sanitized}@stands.internal`;
}

export async function loginWithUsername(username: string) {
  try {
    // Look up company by name (case-insensitive)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('role', 'company')
      .ilike('name', username.trim())
      .maybeSingle();

    if (!user) {
      return { error: 'Usuario o contraseña incorrectos' };
    }

    // Return the deterministic internal email
    const email = usernameToEmail(user.name);
    return { email };
  } catch (error: any) {
    return { error: error.message };
  }
}
