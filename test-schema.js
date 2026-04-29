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

  const { data, error } = await supabaseAdmin.from('stand_elements').select('*').limit(1);
  console.log('Stand Elements Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data');
  if (error) console.log('Error:', error);
}
test();
