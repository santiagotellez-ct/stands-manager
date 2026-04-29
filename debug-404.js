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

  const id = 'b427a92b-1bb7-4124-8671-3a8da508b265';
  console.log(`Buscando stand_type con id: ${id}`);
  
  const { data: standType, error } = await supabaseAdmin
    .from('stand_types')
    .select('*, elements:stand_type_elements(*)')
    .eq('id', id)
    .single();

  console.log('Stand Type:', standType);
  console.log('Error:', error);
}

test();
