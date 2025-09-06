// apps/ingest-worker/src/index.ts
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

import { fileURLToPath } from 'node:url';
import path from 'path';
import { Readable } from 'stream';
import copyFrom from 'pg-copy-streams';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { buildHeaderMap, toNum, toDateISO } from './mapping.js';

// .env 파일 직접 로딩
import { fileURLToPath as fileURLToPath2 } from 'url';
const __filename2 = fileURLToPath2(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const envPath = path.join(__dirname2, '..', '.env');

console.log('[ingest] Looking for .env file at:', envPath);
console.log('[ingest] File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('[ingest] .env content:', envContent);
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key] = value;
        console.log(`[ingest] Set ${key}=${value.substring(0, 20)}...`);
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

// Supabase 클라이언트 (상태 기록용)
import { createClient } from '@supabase/supabase-js';

async function markJob(tenantId: string, fileId: string, patch: any) {
  try {
    await supa
      .from('analytics.ingest_jobs')
      .upsert([{ tenant_id: tenantId, file_id: fileId, ...patch }], { 
        onConflict: 'tenant_id,file_id' 
      });
    console.log(`[ingest] Job 상태 업데이트: ${tenantId}/${fileId}`, patch);
  } catch (error) {
    console.error('[ingest] Job 상태 업데이트 실패:', error);
  }
}

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
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Supabase 클라이언트 (상태 기록용)
const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
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

// CSV 스트리밍 파싱 함수 (배치 처리 + 헤더 매핑)
async function parseCSVStreaming(
  content: string, 
  tenantId: string, 
  batchSize: number = 1000
): Promise<{
  batches: any[][];
  hasRequired: boolean;
  finalHeaders: string[];
}> {
  try {
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    if (rows.length === 0) {
      return { batches: [], hasRequired: false, finalHeaders: [] };
    }
    
    // 첫 번째 행에서 헤더 추출
    const rawHeaders = Object.keys(rows[0]);
    console.log(`[parse] Raw headers:`, rawHeaders);
    
    // DB 기반 헤더 매핑
    const { finalHeaders, hasRequired, mappingResult } = await buildHeaderMap(tenantId, rawHeaders);
    
    if (!hasRequired) {
      throw new Error(`Missing required columns. Required: date, region, channel, sku, qty. Found: ${finalHeaders.join(', ')}`);
    }
    
    console.log(`[parse] Mapped headers:`, finalHeaders);
    console.log(`[parse] Mapping result:`, mappingResult);
    
    // 매핑된 헤더로 데이터 변환
    const mappedRows = rows.map((row: any) => {
      const mappedRow: any = {};
      
      // 매핑 결과에 따라 데이터 변환
      Object.entries(mappingResult).forEach(([field, columnIndex]) => {
        const rawValue = rawHeaders[columnIndex] ? row[rawHeaders[columnIndex]] : undefined;
        
        switch (field) {
          case 'sales_date':
            mappedRow.sales_date = toDateISO(rawValue) || rawValue || '';
            break;
          case 'qty':
            mappedRow.qty = toNum(rawValue) || 0;
            break;
          case 'revenue':
            mappedRow.revenue = toNum(rawValue) || 0;
            break;
          case 'cost':
            mappedRow.cost = toNum(rawValue) || 0;
            break;
          default:
            mappedRow[field] = rawValue || '';
        }
      });
      
      // extras에 원본 데이터 저장
      mappedRow.extras = JSON.stringify(row);
      
      return mappedRow;
    });
    
    // 배치로 나누기
    const batches: any[][] = [];
    for (let i = 0; i < mappedRows.length; i += batchSize) {
      batches.push(mappedRows.slice(i, i + batchSize));
    }
    
    return { batches, hasRequired, finalHeaders };
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
      
      // Storage에서 incoming 폴더의 파일들 조회
      console.log("Fetching files from storage...");
      const { data: files, error } = await supabase.storage
        .from('ingest')
        .list('incoming', { limit: 10 });
      
      if (error) {
        console.error("Failed to fetch files from storage:", error);
        await new Promise(r => setTimeout(r, POLL_MS));
        continue;
      }

      if (!files || files.length === 0) {
        console.log("No files found in storage");
        await new Promise(r => setTimeout(r, POLL_MS));
        continue;
      }

      // 파일들을 uploads 형태로 변환
      const uploads = files.map(file => ({
        file_id: file.name.split('_')[0] || crypto.randomUUID(),
        tenant_id: '00000000-0000-0000-0000-000000000001', // 기본 테넌트
        path: `incoming/${file.name}`,
        status: 'RECEIVED'
      }));
      
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
          const { batches, hasRequired, finalHeaders } = await parseCSVStreaming(fileContent, upload.tenant_id, 1000);
          
          if (!hasRequired) {
            throw new Error(`CSV validation failed: Missing required columns. Headers: ${finalHeaders.join(', ')}`);
          }
          
          console.log(`Parsed ${batches.flat().length} rows from ${upload.path} in ${batches.length} batches`);
          console.log(`Headers mapped successfully: ${finalHeaders.join(', ')}`);
          
          // public.sales에 데이터 직접 삽입 (배치별로)
          let totalInserted = 0;
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const salesData = batch.map((row, i) => ({
              tenant_id: upload.tenant_id,
              sale_date: row.sales_date || new Date().toISOString().split('T')[0],
              barcode: parseInt(row.sku) || 0,
              productname: row.category || '',
              qty: parseInt(row.qty) || 0,
              unit_price: parseFloat(row.revenue) / (parseInt(row.qty) || 1) || 0,
              revenue: parseFloat(row.revenue) || 0,
              channel: (row.channel || 'online').toString().toLowerCase()
            }));
            
            const { error: insertError } = await supabase
              .from('sales')
              .insert(salesData);
            
            if (insertError) {
              throw new Error(`Batch insert failed: ${insertError.message}`);
            }
            
            totalInserted += salesData.length;
            console.log(`Inserted batch ${batchIndex + 1}/${batches.length} (${salesData.length} rows)`);
          }
          
          console.log(`Successfully inserted ${totalInserted} rows to stage_sales`);
          
          // 스테이징 완료 상태 기록
          await markJob(upload.tenant_id, upload.file_id, { 
            status: 'staging', 
            rows_staged: totalInserted 
          });
          
          // 머지 시작 상태 기록
          await markJob(upload.tenant_id, upload.file_id, { 
            status: 'merging' 
          });
          
          // 머지 함수 호출
          console.log(`Calling board_merge_file for file_id: ${upload.file_id}`);
          const { error: mergeError } = await supabase.rpc('board_merge_file', {
            p_tenant_id: upload.tenant_id,
            p_file_id: upload.file_id
          });
          
          if (mergeError) {
            await markJob(upload.tenant_id, upload.file_id, { 
              status: 'failed', 
              message: mergeError.message 
            });
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