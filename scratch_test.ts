import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testSync() {
  const { data: stands } = await supabaseAdmin.from('stands').select('id, stand_type_id, company_id');
  console.log("All stands:", stands);
  
  if (stands && stands.length > 0) {
    const stand = stands[0];
    const { data: standElements } = await supabaseAdmin
      .from('stand_elements')
      .select('id, name, notes, quantity')
      .eq('stand_id', stand.id);
    console.log(`Elements for stand ${stand.id}:`, standElements);
    
    const { data: standTypeElements } = await supabaseAdmin
      .from('stand_type_elements')
      .select('id, name, description, quantity')
      .eq('stand_type_id', stand.stand_type_id);
    console.log(`Template elements for type ${stand.stand_type_id}:`, standTypeElements);
  }
}

testSync();
