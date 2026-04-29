import { createClient } from '@supabase/supabase-js';
import { parse } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

async function test() {
  const envConfig = parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
  const supabaseAdmin = createClient(
    envConfig['NEXT_PUBLIC_SUPABASE_URL'],
    envConfig['SUPABASE_SERVICE_ROLE_KEY'],
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: types, error: err1 } = await supabaseAdmin.from('stand_types').select('id').limit(1);
  if (types && types.length > 0) {
    const id = types[0].id;
    const { data, error } = await supabaseAdmin
      .from('stand_types')
      .select('*, elements:stand_type_elements(*)')
      .eq('id', id)
      .single();
    
    console.log('Data:', data);
    console.log('Error:', error);
  } else {
    console.log('No stand types found');
  }
}
test();
