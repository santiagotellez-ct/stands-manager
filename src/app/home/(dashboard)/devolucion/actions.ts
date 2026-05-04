'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeReturn(standId: string) {
  try {
    const supabase = await createClient();
    
    // Check pending photos using the RPC function
    const { data: pendingCount, error: rpcError } = await supabase.rpc('pending_return_photos_count', {
      stand_uuid: standId
    });

    if (rpcError) throw rpcError;

    if (pendingCount > 0) {
      return { error: `Faltan ${pendingCount} fotos de evidencias por subir.` };
    }

    // Update returned_at
    const { error: updateError } = await supabase.from('stands').update({
      returned_at: new Date().toISOString()
    }).eq('id', standId);

    if (updateError) throw updateError;

    revalidatePath('/home');
    revalidatePath('/home/devolucion');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
