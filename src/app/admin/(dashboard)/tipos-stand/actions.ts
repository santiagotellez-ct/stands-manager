'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

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
      // Get current template elements BEFORE update (to map old names to new names)
      const { data: oldTemplateElements } = await supabaseAdmin
        .from('stand_type_elements')
        .select('id, name')
        .eq('stand_type_id', typeId)
        .order('sort_order');

      // Build a map from old element ID -> old name
      const oldElementNameById: Record<string, string> = {};
      oldTemplateElements?.forEach(e => { oldElementNameById[e.id] = e.name; });

      // Update existing type info
      const { error: typeError } = await supabaseAdmin.from('stand_types').update({
        name: data.name,
        description: data.description,
        default_return_available_at: data.default_return_available_at || null,
        notes: data.notes,
        default_general_photo_url: data.default_general_photo_url,
      }).eq('id', typeId);
      
      if (typeError) throw typeError;

      // 2. Delete removed elements from template
      const currentElementIds = data.elements.map((e: any) => e.id).filter((id: any) => typeof id === 'string' && id.trim() !== '');
      if (currentElementIds.length > 0) {
         await supabaseAdmin.from('stand_type_elements').delete().eq('stand_type_id', typeId).not('id', 'in', `(${currentElementIds.join(',')})`);
      } else {
         await supabaseAdmin.from('stand_type_elements').delete().eq('stand_type_id', typeId);
      }

      // 3. Upsert template elements
      const elementsToUpsert = data.elements.map((el: any, idx: number) => {
        const payload: any = {
          stand_type_id: typeId,
          name: el.name,
          quantity: el.quantity,
          description: el.description,
          default_delivery_photo_url: el.default_delivery_photo_url,
          sort_order: idx,
        };
        if (el.id && typeof el.id === 'string' && el.id.trim() !== '') {
          payload.id = el.id;
        } else {
          payload.id = crypto.randomUUID();
        }
        return payload;
      });

      const { error: elError } = await supabaseAdmin.from('stand_type_elements')
        .upsert(elementsToUpsert, { onConflict: 'id' });
      if (elError) throw elError;

      // 4. SYNC TO EXISTING STANDS
      const { data: stands } = await supabaseAdmin.from('stands').select('id, company_id').eq('stand_type_id', typeId);
      if (stands && stands.length > 0) {
        // Sync return date to all assigned stands
        const newReturnDate = data.default_return_available_at || null;
        await supabaseAdmin.from('stands').update({
          return_available_at: newReturnDate,
        }).eq('stand_type_id', typeId);

        // Build old name -> new data map using template element IDs
        const renamedMap: Array<{ oldName: string; newName: string; quantity: number; description: string | null; sortOrder: number }> = [];
        const brandNewElements: Array<{ name: string; quantity: number; description: string | null; deliveryPhotoUrl: string | null; sortOrder: number }> = [];

        for (let idx = 0; idx < data.elements.length; idx++) {
          const el = data.elements[idx];
          const elId = el.id && typeof el.id === 'string' && el.id.trim() !== '' ? el.id : null;

          if (elId && oldElementNameById[elId]) {
            renamedMap.push({
              oldName: oldElementNameById[elId],
              newName: el.name,
              quantity: el.quantity,
              description: el.description || null,
              sortOrder: idx,
            });
          } else {
            brandNewElements.push({
              name: el.name,
              quantity: el.quantity,
              description: el.description || null,
              deliveryPhotoUrl: el.default_delivery_photo_url || null,
              sortOrder: idx,
            });
          }
        }

        // Old names that were removed from template
        const deletedOldNames = Object.values(oldElementNameById).filter(
          oldName => !renamedMap.some(r => r.oldName === oldName)
        );

        for (const stand of stands) {
          const { data: standElements } = await supabaseAdmin
            .from('stand_elements')
            .select('id, name')
            .eq('stand_id', stand.id);

          if (!standElements) continue;

          // 1. Delete removed elements
          if (deletedOldNames.length > 0) {
            const idsToDelete = standElements
              .filter(se => deletedOldNames.includes(se.name))
              .map(se => se.id);
            if (idsToDelete.length > 0) {
              await supabaseAdmin.from('stand_elements').delete().in('id', idsToDelete);
            }
          }

          // 2. Update existing elements (name, quantity, sort_order, and description if column exists)
          for (const mapped of renamedMap) {
            const match = standElements.find(se => se.name === mapped.oldName);
            if (match) {
              const updatePayload: Record<string, any> = {
                name: mapped.newName,
                quantity: mapped.quantity,
                sort_order: mapped.sortOrder,
              };
              // Try to update description - some schemas may use 'description', others 'notes'
              if (mapped.description !== undefined) {
                updatePayload.description = mapped.description;
              }
              await supabaseAdmin.from('stand_elements').update(updatePayload).eq('id', match.id);
            }
          }

          // 3. Insert brand new elements
          if (brandNewElements.length > 0) {
            const currentNames = standElements.map(se => se.name);
            // Also account for elements we just renamed
            const renamedNewNames = renamedMap.map(r => r.newName);
            const allCurrentNames = [...currentNames.filter(n => !deletedOldNames.includes(n)), ...renamedNewNames];
            
            const toInsert = brandNewElements.filter(ne => !allCurrentNames.includes(ne.name));
            if (toInsert.length > 0) {
              await supabaseAdmin.from('stand_elements').insert(
                toInsert.map(ne => ({
                  stand_id: stand.id,
                  name: ne.name,
                  quantity: ne.quantity,
                  description: ne.description,
                  delivery_photo_url: ne.deliveryPhotoUrl,
                  sort_order: ne.sortOrder,
                }))
              );
            }
          }
        }

        // Revalidate all affected company pages
        for (const stand of stands) {
          revalidatePath(`/admin/empresas/${stand.company_id}`);
        }
        revalidatePath('/home/stand');
      }
    }

    revalidatePath('/admin/tipos-stand');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
