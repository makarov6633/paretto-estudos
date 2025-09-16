import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ADMIN_SECRET = process.env.ADMIN_IMPORT_SECRET || 'dev-admin-secret';
const API_URL = process.env.LOCAL_IMPORT_API_URL || 'http://localhost:3000/api/admin/import';

function readJson(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${filePath}`);
  const raw = fs.readFileSync(abs, 'utf-8');
  return JSON.parse(raw);
}

async function main() {
  const itemsJsonPath = fs.existsSync('items.json') ? 'items.json' : path.join('content', 'items.json');
  const payload = readJson(itemsJsonPath);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Import failed: ${res.status} ${res.statusText} -> ${errText}`);
  }
  const json = await res.json();
  console.log('Import result:', JSON.stringify(json, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


