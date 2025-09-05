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
const envPath = path.join(__dirname2, '..', '.env');

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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase 서비스 역할 키를 사용한 데이터베이스 연결
// 실제로는 Supabase 클라이언트를 통해 직접 처리하므로 DB 연결 불필요

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ingest] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
  process.exit(1);
}

// PostgreSQL 풀 제거 - Supabase 클라이언트만 사용

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
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
});

// 테넌트 설정 함수 (Supabase RPC 사용)
async function setTenant(tenant: string) {
  try {
    const { error } = await supabase.rpc('set_config', {
      parameter: 'app.tenant_id',
      value: tenant,
      is_local: true
    });
    if (error) {
      console.log(`[tenant] RPC set_config not available, continuing...`);
    } else {
      console.log(`[tenant] Set tenant_id to: ${tenant}`);
    }
  } catch (err) {
    console.log(`[tenant] RPC set_config failed, continuing...`);
  }
}

// CSV 스트리밍 파싱 함수 (배치 처리)
async function parseCSVStreaming(content: string, batchSize: number = 1000): Promise<any[][]> {
  try {
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // 배치로 나누기
    const batches: any[][] = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      batches.push(rows.slice(i, i + batchSize));
    }
    
    return batches;
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
          const batches = await parseCSVStreaming(fileContent, 1000);
          
          console.log(`Parsed ${batches.flat().length} rows from ${upload.filename} in ${batches.length} batches`);
          
          // analytics.stage_sales에 데이터 삽입 (배치별로)
          let totalInserted = 0;
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const stageData = batch.map((row, i) => ({
              tenant_id: upload.tenant_id,
              file_id: upload.file_id,
              row_num: totalInserted + i + 1,
              sku: row.sku || row.barcode || '',
              sale_date: row.sale_date || row.date || '', // 텍스트로 저장
              qty: row.qty || row.quantity || '0', // 텍스트로 저장
              revenue: row.revenue || row.sales || '0', // 텍스트로 저장
              channel: row.channel || '',
              region: row.region || '',
              category: row.category || '',
              extras: JSON.stringify(row)
            }));
            
            const { error: insertError } = await supabase
              .from('stage_sales')
              .insert(stageData);
            
            if (insertError) {
              throw new Error(`Batch insert failed: ${insertError.message}`);
            }
            
            totalInserted += stageData.length;
            console.log(`Inserted batch ${batchIndex + 1}/${batches.length} (${stageData.length} rows)`);
          }
          
          console.log(`Successfully inserted ${totalInserted} rows to stage_sales`);
          
          // 머지 함수 호출
          console.log(`Calling merge_stage_to_fact for file_id: ${upload.file_id}`);
          const { error: mergeError } = await supabase.rpc('merge_stage_to_fact', {
            p_tenant_id: upload.tenant_id,
            p_file_id: upload.file_id
          });
          
          if (mergeError) {
            throw new Error(`Merge failed: ${mergeError.message}`);
          }
          
          console.log(`Successfully merged data to fact_sales`);
          
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

export { main, loop, setTenant, parseCSVStreaming };