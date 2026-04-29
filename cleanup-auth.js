import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'dotenv';

async function cleanup() {
  const envConfig = parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
  const supabaseAdmin = createClient(
    envConfig['NEXT_PUBLIC_SUPABASE_URL'],
    envConfig['SUPABASE_SERVICE_ROLE_KEY'],
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const email = 'santiago.tellez@colombiatechweek.co';
  console.log(`Buscando usuario con email: ${email}`);

  // Need to find the user id. We can list users.
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const user = users.find(u => u.email === email);
  if (user) {
    console.log(`Borrando usuario ${user.id}...`);
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error('Error al borrar:', delError);
    } else {
      console.log('Usuario borrado exitosamente.');
    }
  } else {
    console.log('Usuario no encontrado en auth.users.');
  }
}

cleanup();
