import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Copy of the logic from actions.ts
async function saveStandType(typeId: string, data: any) {
  // Get current template elements BEFORE update
  const { data: oldTemplateElements } = await supabaseAdmin
    .from('stand_type_elements')
    .select('id, name')
    .eq('stand_type_id', typeId)
    .order('sort_order');

  console.log("oldTemplateElements from DB:", oldTemplateElements);

  const oldElementNameById: Record<string, string> = {};
  oldTemplateElements?.forEach(e => { oldElementNameById[e.id] = e.name; });

  const renamedElements: any[] = [];
  const brandNewElements: any[] = [];

  for (let idx = 0; idx < data.elements.length; idx++) {
    const el = data.elements[idx];
    const elId = el.id && typeof el.id === 'string' && el.id.trim() !== '' ? el.id : null;
    
    if (elId && oldElementNameById[elId]) {
      renamedElements.push({
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

  console.log("renamedElements:", renamedElements);
  console.log("brandNewElements:", brandNewElements);
}

// Emulate a submit
saveStandType("ee13a151-dc33-4cf0-ae3d-e217e7dea11d", {
  elements: [
    {
      id: "c298be85-7226-40fe-99a7-0e4284180958",
      name: "Cenefas superiores updated",
      quantity: 2,
      description: "Nuevo description"
    },
    {
      name: "Nuevo Elemento Test",
      quantity: 5,
      description: "Test"
    }
  ]
});
