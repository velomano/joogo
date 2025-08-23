// scripts/enqueue-upload.ts
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const bucket = process.env.BUCKET || 'ingest';
const prefix = process.env.PREFIX || 'incoming';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: pnpm tsx scripts/enqueue-upload.ts <local_csv_path>');
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }
  
  const supabase = createClient(url, key);
  const buf = fs.readFileSync(filePath);
  const id = uuid();
  const name = `${id}.csv`;
  const objectPath = `${prefix}/${name}`;

  console.log('[enqueue] uploading', filePath, 'to', `${bucket}/${objectPath}`);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, buf, { upsert: true, contentType: 'text/csv' });

  if (error) {
    console.error('[enqueue] upload failed', error);
    process.exit(1);
  }
  
  console.log('[enqueue] uploaded to', `${bucket}/${objectPath}`);
  console.log('[enqueue] file_id (for logs only):', id);
}

main().catch(console.error);
