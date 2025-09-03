// apps/ingest-worker/src/index.ts
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

import { fileURLToPath } from 'node:url';
import path from 'path';
import { Readable } from 'stream';
import copyFrom from 'pg-copy-streams';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

// .env 파일 직접 로딩
import { fileURLToPath as fileURLToPath2 } from 'url';
const __filename2 = fileURLToPath2(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const envPath = path.join(__dirname2, '..', 'env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key] = value;
      }
    }
  });
  console.log('[ingest] .env file loaded from:', envPath);
} else {
  console.warn('[ingest] .env file not found at:', envPath);
}

// Use require for pg to avoid ESM type issues
const pg = require('pg');

// ESM-friendly path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ESM main-module detection (robust for Windows paths)
const isMain = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : '';
  const here = path.resolve(__filename);
  return argv1 === here;
})();

const DB_URL = process.env.SUPABASE_DB_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DB_URL) {
  console.error('[ingest] SUPABASE_DB_URL is missing');
  console.error('[ingest] Current working directory:', process.cwd());
  console.error('[ingest] .env file path:', envPath);
  console.error('[ingest] Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ingest] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: DB_URL,
  statement_timeout: 0
});

// Supabase 클라이언트 (Storage 접근용)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'analytics' }
});

console.log('[ingest] Supabase client config:', {
  url: SUPABASE_URL?.substring(0, 30) + '...',
  hasKey: !!SUPABASE_SERVICE_ROLE_KEY,
  keyLength: SUPABASE_SERVICE_ROLE_KEY?.length
});

// 폴링 설정
const BUCKET = process.env.STORAGE_BUCKET || 'ingest';
const POLL_MS = parseInt(process.env.POLL_MS || '5000');

console.log('[ingest] Configuration:', {
  bucket: BUCKET,
  pollMs: POLL_MS,
  hasDbUrl: !!DB_URL,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
});

// 테넌트 설정 함수
async function setTenant(tenant: string) {
  const client = await pool.connect();
  try {
    await client.query('SELECT set_config($1, $2, $3)', ['app.tenant_id', tenant, true]);
    console.log(`[tenant] Set tenant_id to: ${tenant}`);
  } finally {
    client.release();
  }
}

// CSV 파싱 함수
function parseCSV(content: string): any[] {
  try {
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    return rows;
  } catch (error) {
    console.error('[parse] CSV parsing error:', error);
    throw error;
  }
}

// 메인 루프
async function loop() {
  let shouldContinue = true;
  while (shouldContinue) {
    try {
      console.log("Polling for new uploads...");
      
      // analytics.raw_uploads에서 RECEIVED 상태인 작업들 가져오기
      console.log("Fetching uploads from analytics.raw_uploads...");
      const { data: uploads, error } = await supabase
        .from('raw_uploads')
        .select('*')
        .eq('status', 'RECEIVED')
        .limit(10);
      
      if (error) {
        console.error("Failed to fetch uploads:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        await new Promise(r => setTimeout(r, POLL_MS));
        continue;
      }
      
      console.log("Query result:", { uploads: uploads?.length || 0, error: !!error });
      
      if (!uploads || uploads.length === 0) {
        console.log("No pending uploads");
        await new Promise(r => setTimeout(r, POLL_MS));
        continue;
      }
      
      console.log(`Found ${uploads.length} pending uploads`);
      
      for (const upload of uploads) {
        try {
          console.log(`Processing upload: ${upload.file_id} (${upload.path})`);
          
          // 상태를 PROCESSING으로 업데이트
          await supabase
            .from('raw_uploads')
            .update({ status: 'PROCESSING' })
            .eq('file_id', upload.file_id);
          
          // 테넌트 설정
          await setTenant(upload.tenant_id);
          
          // Storage에서 파일 다운로드
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(BUCKET)
            .download(upload.path);
          
          if (downloadError) {
            throw new Error(`Storage download failed: ${downloadError.message}`);
          }
          
          // 파일 내용 읽기
          const fileContent = await fileData.text();
          const rows = parseCSV(fileContent);
          
          console.log(`Parsed ${rows.length} rows from ${upload.filename}`);
          
          // analytics.stage_sales에 데이터 삽입
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              await client.query(`
                INSERT INTO analytics.stage_sales (
                  tenant_id, file_id, row_num, sku, extras
                ) VALUES ($1, $2, $3, $4, $5)
              `, [
                upload.tenant_id,
                upload.file_id,
                i + 1,
                row.sku || row.barcode,
                JSON.stringify(row)
              ]);
            }
            
            await client.query('COMMIT');
            console.log(`Successfully inserted ${rows.length} rows to stage_sales`);
            
          } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
          } finally {
            client.release();
          }
          
          // 성공 시 상태 업데이트
          await supabase
            .from('raw_uploads')
            .update({ 
              status: 'COMPLETED',
              staged_at: new Date().toISOString()
            })
            .eq('file_id', upload.file_id);
          
          console.log(`✅ Upload ${upload.file_id} processed successfully`);
          
        } catch (uploadError: any) {
          console.error(`❌ Upload ${upload.file_id} failed:`, uploadError);
          
          // 실패 시 상태 업데이트
          await supabase
            .from('raw_uploads')
            .update({ 
              status: 'FAILED',
              error: String(uploadError.message || uploadError)
            })
            .eq('file_id', upload.file_id);
        }
      }
      
    } catch (loopError) {
      console.error('Loop error:', loopError);
      await new Promise(r => setTimeout(r, POLL_MS));
    }
  }
}

// 메인 함수
async function main() {
  console.log('[ingest] Starting ingest worker...');
  console.log('[ingest] Environment check:', {
    hasDbUrl: !!DB_URL,
    hasSupabaseUrl: !!SUPABASE_URL,
    hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
    bucket: BUCKET,
    pollMs: POLL_MS
  });

  // 폴링/다운로드 로직 시작
  await loop();
}

// 메인 모듈일 때만 실행
if (isMain) {
  main().catch(console.error);
}

export { main, loop, setTenant, parseCSV };