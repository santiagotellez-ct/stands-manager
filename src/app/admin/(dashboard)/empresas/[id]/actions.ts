'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

function usernameToEmail(username: string): string {
  const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${sanitized}@stands.internal`;
}

export async function updateCompanyInfo(id: string, data: any) {
  try {
    const newName = data.name?.trim();

    // If name changed, check uniqueness
    if (newName) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'company')
        .ilike('name', newName)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return { error: 'Ya existe una empresa con ese nombre/usuario.' };
      }

      // Update auth email to match new username
      const newInternalEmail = usernameToEmail(newName);
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email: newInternalEmail,
      });
      if (emailError) throw emailError;
    }

    if (data.password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: data.password
      });
      if (authError) throw authError;
    }

    const finalName = newName || data.name;
    const { error: updateError } = await supabaseAdmin.from('users').update({
      name: finalName,
      email: data.email || usernameToEmail(finalName),
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
    
    // Copy checklist items from template to the new stand instance
    const standId = data;
    const { data: templateChecklist } = await supabaseAdmin
      .from('stand_type_checklist_items')
      .select('title, sort_order')
      .eq('stand_type_id', typeId);

    if (templateChecklist && templateChecklist.length > 0) {
      await supabaseAdmin.from('stand_checklist_items').insert(
        templateChecklist.map(item => ({
          stand_id: standId,
          title: item.title,
          sort_order: item.sort_order,
        }))
      );
    }

    revalidatePath(`/admin/empresas/${companyId}`);
    return { success: true, standId };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function unassignStand(standId: string, companyId: string) {
  try {
    await supabaseAdmin.from('stand_elements').delete().eq('stand_id', standId);
    await supabaseAdmin.from('stand_checklist_items').delete().eq('stand_id', standId);
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
    // 1. Delete stand elements for any stands owned by this company
    const { data: stands } = await supabaseAdmin.from('stands').select('id').eq('company_id', id);
    if (stands && stands.length > 0) {
      const standIds = stands.map(s => s.id);
      await supabaseAdmin.from('stand_elements').delete().in('stand_id', standIds);
      await supabaseAdmin.from('stand_checklist_items').delete().in('stand_id', standIds);
    }

    // 2. Delete stands owned by this company
    await supabaseAdmin.from('stands').delete().eq('company_id', id);

    // 3. Delete user row from public.users
    const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (dbError) throw dbError;

    // 4. Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError && !authError.message.includes('User not found')) throw authError;
    
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

export async function adminSignStandReception(standId: string, signatureUrl: string, companyId: string) {
  try {
    const { error } = await supabaseAdmin.from('stands').update({
      delivery_signature_url: signatureUrl,
      signed_at: new Date().toISOString()
    }).eq('id', standId);

    if (error) throw error;

    revalidatePath(`/admin/empresas/${companyId}`);
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
