import pg from 'pg';
import { parse } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

async function fixDb() {
  const envConfig = parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
  const connectionString = envConfig['DATABASE_URL'];

  console.log('Connecting to DB with postgres superuser...');
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('Granting permissions to service_role...');
    await client.query('GRANT USAGE ON SCHEMA public TO service_role;');
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;');
    await client.query('GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;');
    await client.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;');

    console.log('Granting permissions to anon...');
    await client.query('GRANT USAGE ON SCHEMA public TO anon;');
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;');
    
    console.log('Granting permissions to authenticated...');
    await client.query('GRANT USAGE ON SCHEMA public TO authenticated;');
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;');

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDb();
