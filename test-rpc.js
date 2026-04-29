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

  const { data, error } = await supabaseAdmin.rpc('assign_stand_to_company', {
    p_company_id: 'fake',
    p_stand_type_id: 'fake'
  });
  console.log('Error from RPC call (to see schema):', error);
}
test();
