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

  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      name,
      stands_with_computed_status (
        id,
        computed_status,
        stand_types (name)
      )
    `)
    .eq('role', 'company');
  
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
test();
