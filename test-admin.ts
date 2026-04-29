import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const envConfig = parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  console.log('Testing...');
  
  const { data: existingAdmins, error: checkError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1);
    
  console.log('Check Error:', checkError);
  console.log('Existing Admins:', existingAdmins);

  if (existingAdmins && existingAdmins.length > 0) {
    console.log('Admin exists, deleting so we can test creation...');
    await supabaseAdmin.auth.admin.deleteUser(existingAdmins[0].id);
  }

  const email = 'santiago.tellez@colombiatechweek.co';
  const name = 'Santiago Tellez';
  const password = 'Password123!';

  console.log('Creating auth user...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  });

  console.log('Auth Error:', authError);
  if (authError) return;

  console.log('Creating public user...');
  const { error: insertError } = await supabaseAdmin.from('users').insert({
    id: authData.user.id,
    email: email,
    name: name,
    role: 'admin',
  });

  console.log('Insert Error:', insertError);
}

test();
