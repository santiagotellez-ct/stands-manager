'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function signStandReception(standId: string, signatureUrl: string) {
  try {
    const supabase = await createClient();
    
    // Check if user owns the stand
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autorizado');

    const { data: stand } = await supabase.from('stands').select('company_id').eq('id', standId).single();
    if (!stand || stand.company_id !== user.id) throw new Error('No autorizado');

    const { error } = await supabase.from('stands').update({
      delivery_signature_url: signatureUrl,
      signed_at: new Date().toISOString()
    }).eq('id', standId);

    if (error) throw error;

    revalidatePath('/home');
    revalidatePath('/home/stand');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
