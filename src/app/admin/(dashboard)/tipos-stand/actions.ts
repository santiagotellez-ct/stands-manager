'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

export async function saveStandType(id: string | undefined, data: any) {
  try {
    let typeId = id;
    
    if (!typeId) {
      // Create new
      const { data: newType, error: typeError } = await supabaseAdmin.from('stand_types').insert({
        name: data.name,
        description: data.description,
        default_return_available_at: data.default_return_available_at || null,
        notes: data.notes,
        default_general_photo_url: data.default_general_photo_url,
      }).select().single();
      
      if (typeError) throw typeError;
      typeId = newType.id;
      
      const elementsToInsert = data.elements.map((el: any, idx: number) => ({
        stand_type_id: typeId,
        name: el.name,
        quantity: el.quantity,
        description: el.description,
        default_delivery_photo_url: el.default_delivery_photo_url,
        sort_order: idx,
      }));
      const { error: elError } = await supabaseAdmin.from('stand_type_elements').insert(elementsToInsert);
      if (elError) throw elError;
      
    } else {
      // Update existing
      const { error: typeError } = await supabaseAdmin.from('stand_types').update({
        name: data.name,
        description: data.description,
        default_return_available_at: data.default_return_available_at || null,
        notes: data.notes,
        default_general_photo_url: data.default_general_photo_url,
      }).eq('id', typeId);
      
      if (typeError) throw typeError;

      // 2. Delete removed elements from template first to avoid deleting newly inserted ones
      const currentElementIds = data.elements.map((e: any) => e.id).filter((id: any) => typeof id === 'string' && id.trim() !== '');
      if (currentElementIds.length > 0) {
         await supabaseAdmin.from('stand_type_elements').delete().eq('stand_type_id', typeId).not('id', 'in', `(${currentElementIds.join(',')})`);
      } else {
         await supabaseAdmin.from('stand_type_elements').delete().eq('stand_type_id', typeId);
      }

      // 3. Separate into inserted, updated
      const elementsToUpsert = data.elements.map((el: any, idx: number) => {
        const payload: any = {
          stand_type_id: typeId,
          name: el.name,
          quantity: el.quantity,
          description: el.description,
          default_delivery_photo_url: el.default_delivery_photo_url,
          sort_order: idx,
        };
        // Add ID only if it's a valid string to prevent UUID syntax errors
        if (el.id && typeof el.id === 'string' && el.id.trim() !== '') {
          payload.id = el.id;
        } else {
          // Generate a new UUID for elements that don't have one
          // This ensures all objects in the upsert array have an 'id' key
          payload.id = crypto.randomUUID();
        }
        return payload;
      });

      const { error: elError } = await supabaseAdmin.from('stand_type_elements')
        .upsert(elementsToUpsert, { onConflict: 'id' });
      if (elError) throw elError;

      // 4. SYNC TO EXISTING STANDS
      const { data: stands } = await supabaseAdmin.from('stands').select('id').eq('stand_type_id', typeId);
      if (stands && stands.length > 0) {
        for (const stand of stands) {
          // Get current elements for this stand
          const { data: standElements } = await supabaseAdmin.from('stand_elements').select('id, name').eq('stand_id', stand.id);
          const standElementNames = standElements?.map(e => e.name) || [];
          
          // Add new elements
          const elementsToAdd = data.elements.filter((el: any) => !standElementNames.includes(el.name));
          if (elementsToAdd.length > 0) {
            const newStandElements = elementsToAdd.map((el: any) => ({
              stand_id: stand.id,
              name: el.name,
              quantity: el.quantity,
              delivery_photo_url: el.default_delivery_photo_url,
              sort_order: data.elements.findIndex((e: any) => e.name === el.name)
            }));
            await supabaseAdmin.from('stand_elements').insert(newStandElements);
          }
          
          // Delete elements
          const templateElementNames = data.elements.map((el: any) => el.name);
          const elementsToDelete = standElements?.filter(e => !templateElementNames.includes(e.name));
          if (elementsToDelete && elementsToDelete.length > 0) {
            const idsToDelete = elementsToDelete.map(e => e.id);
            await supabaseAdmin.from('stand_elements').delete().in('id', idsToDelete);
          }

          // Update existing elements
          const elementsToUpdate = standElements?.filter(e => templateElementNames.includes(e.name));
          if (elementsToUpdate && elementsToUpdate.length > 0) {
            for (const standEl of elementsToUpdate) {
              const templateEl = data.elements.find((el: any) => el.name === standEl.name);
              if (templateEl) {
                await supabaseAdmin.from('stand_elements').update({
                  quantity: templateEl.quantity,
                  sort_order: data.elements.findIndex((e: any) => e.name === templateEl.name)
                }).eq('id', standEl.id);
              }
            }
          }
        }
      }
    }
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
