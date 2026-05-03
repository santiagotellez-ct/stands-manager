import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('stand_type_elements').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data keys stand_type_elements:', data && data.length > 0 ? Object.keys(data[0]) : 'No data');
}

check();
