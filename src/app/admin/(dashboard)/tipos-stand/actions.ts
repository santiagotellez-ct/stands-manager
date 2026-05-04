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
      
      const checklistToInsert = data.checklist?.map((el: any, idx: number) => ({
        stand_type_id: typeId,
        title: el.title,
        sort_order: idx,
      })) || [];
      if (checklistToInsert.length > 0) {
        const { error: chkError } = await supabaseAdmin.from('stand_type_checklist_items').insert(checklistToInsert);
        if (chkError) throw chkError;
      }
      
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

      // Get current template checklist BEFORE update
      const { data: oldTemplateChecklist } = await supabaseAdmin
        .from('stand_type_checklist_items')
        .select('id, title')
        .eq('stand_type_id', typeId)
        .order('sort_order');

      const oldChecklistTitleById: Record<string, string> = {};
      oldTemplateChecklist?.forEach(e => { oldChecklistTitleById[e.id] = e.title; });

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

      // 3.5 Upsert checklist for the template
      const currentChecklistIds = data.checklist?.map((c: any) => c.id).filter((id: any) => typeof id === 'string' && id.trim() !== '') || [];
      if (currentChecklistIds.length > 0) {
        await supabaseAdmin.from('stand_type_checklist_items').delete().eq('stand_type_id', typeId).not('id', 'in', `(${currentChecklistIds.join(',')})`);
      } else {
        await supabaseAdmin.from('stand_type_checklist_items').delete().eq('stand_type_id', typeId);
      }

      const checklistToUpsert = data.checklist?.map((c: any, idx: number) => {
        const payload: any = {
          stand_type_id: typeId,
          title: c.title,
          description: c.description || null,
          sort_order: idx,
        };
        if (c.id && typeof c.id === 'string' && c.id.trim() !== '') {
          payload.id = c.id;
        } else {
          payload.id = crypto.randomUUID();
        }
        return payload;
      }) || [];

      if (checklistToUpsert.length > 0) {
        const { error: chkError } = await supabaseAdmin.from('stand_type_checklist_items').upsert(checklistToUpsert, { onConflict: 'id' });
        if (chkError) throw chkError;
      }

      // 4. SYNC TO EXISTING STANDS - improved to handle name/description/quantity changes
      const { data: stands } = await supabaseAdmin.from('stands').select('id, company_id').eq('stand_type_id', typeId);
      if (stands && stands.length > 0) {
        // Sync return date to all assigned stands
        const newReturnDate = data.default_return_available_at || null;
        await supabaseAdmin.from('stands').update({
          return_available_at: newReturnDate,
        }).eq('stand_type_id', typeId);
        // Build mapping: for elements that existed before, map old name -> new data
        // Elements with an existing ID had an old name we can track
        const renamedElements: Array<{ oldName: string; newName: string; quantity: number; description: string | null; sortOrder: number }> = [];
        const brandNewElements: Array<{ name: string; quantity: number; description: string | null; deliveryPhotoUrl: string | null; sortOrder: number }> = [];

        for (let idx = 0; idx < data.elements.length; idx++) {
          const el = data.elements[idx];
          const elId = el.id && typeof el.id === 'string' && el.id.trim() !== '' ? el.id : null;
          
          if (elId && oldElementNameById[elId]) {
            // This element existed before - it might have been renamed or updated
            renamedElements.push({
              oldName: oldElementNameById[elId],
              newName: el.name,
              quantity: el.quantity,
              description: el.description || null,
              sortOrder: idx,
            });
          } else {
            // Completely new element
            brandNewElements.push({
              name: el.name,
              quantity: el.quantity,
              description: el.description || null,
              deliveryPhotoUrl: el.default_delivery_photo_url || null,
              sortOrder: idx,
            });
          }
        }

        const renamedChecklists: Array<{ oldTitle: string; newTitle: string; description: string | null; sortOrder: number }> = [];
        const brandNewChecklists: Array<{ title: string; description: string | null; sortOrder: number }> = [];

        for (let idx = 0; idx < (data.checklist?.length || 0); idx++) {
          const c = data.checklist[idx];
          const cId = c.id && typeof c.id === 'string' && c.id.trim() !== '' ? c.id : null;
          if (cId && oldChecklistTitleById[cId]) {
            renamedChecklists.push({ oldTitle: oldChecklistTitleById[cId], newTitle: c.title, description: c.description || null, sortOrder: idx });
          } else {
            brandNewChecklists.push({ title: c.title, description: c.description || null, sortOrder: idx });
          }
        }

        const deletedOldChecklistTitles = Object.values(oldChecklistTitleById).filter(
          oldTitle => !renamedChecklists.some(r => r.oldTitle === oldTitle)
        );

        // Names of elements that should remain (after rename)
        const deletedOldNames = Object.values(oldElementNameById).filter(
          oldName => !renamedElements.some(r => r.oldName === oldName)
        );

        for (const stand of stands) {
          // Get current stand elements
          const { data: standElements } = await supabaseAdmin
            .from('stand_elements')
            .select('id, name')
            .eq('stand_id', stand.id);

          if (!standElements) continue;

          // Delete elements whose template was removed
          if (deletedOldNames.length > 0) {
            const idsToDelete = standElements.filter(se => deletedOldNames.includes(se.name)).map(se => se.id);
            if (idsToDelete.length > 0) {
              await supabaseAdmin.from('stand_elements').delete().in('id', idsToDelete);
            }
          }

          // Update existing elements (rename + update quantity/description/sort_order)
          for (const renamed of renamedElements) {
            const matchingStandEl = standElements.find(se => se.name === renamed.oldName);
            if (matchingStandEl) {
              await supabaseAdmin.from('stand_elements').update({
                name: renamed.newName,
                quantity: renamed.quantity,
                notes: renamed.description,
                sort_order: renamed.sortOrder,
              }).eq('id', matchingStandEl.id);
            }
          }

          // Add brand new elements
          if (brandNewElements.length > 0) {
            const existingNames = standElements.map(se => se.name);
            const toInsert = brandNewElements.filter(ne => !existingNames.includes(ne.name));
            if (toInsert.length > 0) {
              await supabaseAdmin.from('stand_elements').insert(
                toInsert.map(ne => ({
                  stand_id: stand.id,
                  name: ne.name,
                  quantity: ne.quantity,
                  notes: ne.description,
                  delivery_photo_url: ne.deliveryPhotoUrl,
                  sort_order: ne.sortOrder,
                }))
              );
            }
          }

          // Handle checklist sync for existing stand
          const { data: standChecklist } = await supabaseAdmin
            .from('stand_checklist_items')
            .select('id, title')
            .eq('stand_id', stand.id);
            
          if (standChecklist) {
            if (deletedOldChecklistTitles.length > 0) {
              const idsToDelete = standChecklist.filter(sc => deletedOldChecklistTitles.includes(sc.title)).map(sc => sc.id);
              if (idsToDelete.length > 0) {
                await supabaseAdmin.from('stand_checklist_items').delete().in('id', idsToDelete);
              }
            }
            
            for (const renamed of renamedChecklists) {
              const matching = standChecklist.find(sc => sc.title === renamed.oldTitle);
              if (matching) {
                await supabaseAdmin.from('stand_checklist_items').update({
                  title: renamed.newTitle,
                  description: renamed.description,
                  sort_order: renamed.sortOrder,
                }).eq('id', matching.id);
              }
            }
            
            if (brandNewChecklists.length > 0) {
              const existingTitles = standChecklist.map(sc => sc.title);
              const toInsert = brandNewChecklists.filter(nc => !existingTitles.includes(nc.title));
              if (toInsert.length > 0) {
                await supabaseAdmin.from('stand_checklist_items').insert(
                  toInsert.map(nc => ({
                    stand_id: stand.id,
                    title: nc.title,
                    description: nc.description,
                    sort_order: nc.sortOrder,
                  }))
                );
              }
            }
          } else if (brandNewChecklists.length > 0 || renamedChecklists.length > 0) {
            // If stand had no checklist at all, but template added some, insert them all
            const allToCheck = [...renamedChecklists.map(c => ({ title: c.newTitle, description: c.description, sortOrder: c.sortOrder })), ...brandNewChecklists];
            await supabaseAdmin.from('stand_checklist_items').insert(
              allToCheck.map(nc => ({
                stand_id: stand.id,
                title: nc.title,
                description: nc.description,
                sort_order: nc.sortOrder,
              }))
            );
          }
        }

        // Revalidate all company pages
        for (const stand of stands) {
          revalidatePath(`/admin/empresas/${stand.company_id}`);
        }
      }
    }

    revalidatePath('/admin/tipos-stand');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
