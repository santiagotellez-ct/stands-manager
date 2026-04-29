import { parse } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Manual polyfill of fetch for Node 16 if needed, but NextJS uses newer Node
async function test() {
  const envConfig = parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
  const url = envConfig['NEXT_PUBLIC_SUPABASE_URL'];
  const key = envConfig['SUPABASE_SERVICE_ROLE_KEY'];

  // Check users in public.users
  const res = await fetch(`${url}/rest/v1/users`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await res.json();
  console.log('Public Users:', data);

  // Check auth.users if possible (PostgREST usually doesn't expose auth.users, but we can try via RPC or just checking the response of createUser)
}
test();
