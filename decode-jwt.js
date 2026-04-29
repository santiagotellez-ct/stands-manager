import * as fs from 'fs';
import * as path from 'path';

function decodeJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
  return JSON.parse(payload);
}

const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const lines = envFile.split('\n');

for (const line of lines) {
  if (line.includes('KEY=')) {
    const parts = line.split('=');
    const name = parts[0];
    const key = parts.slice(1).join('=');
    console.log(name, '-> Role:', decodeJwt(key)?.role);
  }
}
