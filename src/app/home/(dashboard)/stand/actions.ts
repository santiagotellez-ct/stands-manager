'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function toggleChecklistItem(itemId: string, isChecked: boolean, standId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('stand_checklist_items')
      .update({ is_checked: isChecked })
      .eq('id', itemId);

    if (error) throw error;

    revalidatePath('/home/stand');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function signStandReception(standId: string, signatureUrl: string, name: string, role: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    // Check if user owns the stand
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autorizado');

    const { data: stand } = await supabase.from('stands').select('company_id').eq('id', standId).single();
    if (!stand || stand.company_id !== user.id) throw new Error('No autorizado');

    const { error } = await supabase.from('stands').update({
      delivery_signature_url: signatureUrl,
      delivery_signature_name: name,
      delivery_signature_role: role,
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
