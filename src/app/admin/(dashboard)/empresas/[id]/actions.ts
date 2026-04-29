'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateCompanyInfo(id: string, data: any) {
  try {
    if (data.password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: data.password
      });
      if (authError) throw authError;
    }

    const { error: updateError } = await supabaseAdmin.from('users').update({
      name: data.name,
    }).eq('id', id);

    if (updateError) throw updateError;
    
    revalidatePath(`/admin/empresas/${id}`);
    revalidatePath(`/admin/empresas`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function assignStandType(companyId: string, typeId: string, returnDate: string) {
  try {
    const { data, error } = await supabaseAdmin.rpc('assign_stand_to_company', {
      p_stand_type_id: typeId,
      p_company_id: companyId,
      p_return_available_at: returnDate
    });

    if (error) throw error;
    
    revalidatePath(`/admin/empresas/${companyId}`);
    return { success: true, standId: data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function unassignStand(standId: string, companyId: string) {
  try {
    const { error } = await supabaseAdmin.from('stands').delete().eq('id', standId);
    if (error) throw error;
    
    revalidatePath(`/admin/empresas/${companyId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCompany(id: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error && !error.message.includes('User not found')) throw error;
    
    const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (dbError) throw dbError;
    
    revalidatePath('/admin/empresas');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateReturnDate(standId: string, companyId: string, newDate: string) {
  try {
    const { error } = await supabaseAdmin.from('stands').update({
      return_available_at: newDate
    }).eq('id', standId);
    
    if (error) throw error;
    
    revalidatePath(`/admin/empresas/${companyId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateStandElementNotes(elementId: string, companyId: string, notes: string) {
  try {
    const { error } = await supabaseAdmin.from('stand_elements').update({
      notes: notes
    }).eq('id', elementId);
    
    if (error) throw error;
    
    revalidatePath(`/admin/empresas/${companyId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
