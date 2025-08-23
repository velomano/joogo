// apps/ingest-worker/src/index.ts
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

import { fileURLToPath } from 'node:url';
import path from 'path';
import { Readable } from 'stream';
import copyFrom from 'pg-copy-streams';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

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
if (!DB_URL) {
  console.error('[ingest] SUPABASE_DB_URL is missing');
  process.exit(1);
}

// 폴링 설정
const BUCKET = process.env.BUCKET || 'ingest';
const PREFIX = process.env.PREFIX || 'incoming'; // 기본값
console.log('[poll] bucket=%s prefix=%s', BUCKET, PREFIX);

const pool = new pg.Pool({
  connectionString: DB_URL,
  statement_timeout: 0,
  idleTimeoutMillis: 0,
  max: 5,
});

// 1) 알려진 키(스테이지 컬럼) — 프로젝트에 맞춰 필요하면 추가/수정
const KNOWN = new Set([
  'tenant_id','sku','channel','warehouse_code','order_id','customer_id',
  'region','brand','sales_date','qty','revenue','cost','file_id','row_num'
]);

// SQL 마이그레이션 적용
async function applyMigrations() {
  const client = await pool.connect();
  try {
    console.log('[migration] Applying SQL migrations...');
    
    const dir = path.join(__dirname, '..', 'sql'); // 실제 경로에 맞춤
    if (!fs.existsSync(dir)) {
      console.log('[migration] no sql dir, skip');
      return;
    }

    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // 버전명순 정렬 가정

    for (const f of files) {
      const full = path.join(dir, f);
      const raw = fs.readFileSync(full, 'utf8');
      const sql = raw.replace(/\r\n/g, '\n'); // CRLF → LF 정규화

      console.log('[migration] applying file:', f);
      try {
        // ★ 파일 내용을 "그대로 한 번"에 실행 (세미콜론으로 안 쪼갬)
        await client.query(sql);
        console.log('[migration] applied:', f);
      } catch (e: any) {
        console.error('[migration] failed on file:', f);
        console.error(e);
        throw e; // 즉시 중단
      }
    }
    
    console.log('[migration] All migrations applied successfully');
  } finally {
    client.release();
  }
}

// CSV → 레코드 배열
function parseCsvBuffer(buf: Buffer): Record<string, string>[] {
  console.log('[parse] using csv-parse relax mode');
  
  // BOM/개행 정리
  const text = buf.toString('utf8').replace(/\uFEFF/g, '').replace(/\r\n/g, '\n');

  // csv-parse: 헤더 사용, 칼럼수 가변 허용, 따옴표/공백 관대 모드
  const rows = parse(text, {
    bom: true,
    columns: (header: string[]) => header.map(h => (h ?? '').trim()),
    skip_empty_lines: true,
    relax_column_count: true,         // 🔑 행마다 칼럼 수 달라도 허용
    relax_column_count_less: true,    // 칼럼 부족 허용
    relax_column_count_more: true,    // 칼럼 초과 허용 (트레일링 콤마 케이스)
    relax_quotes: true,               // 따옴표 깨진 경우도 관대하게
    trim: true
  }) as Record<string, string>[];

  // 트레일링 콤마로 생기는 "빈 헤더" 키 제거
  if (rows.length && ('' in rows[0])) {
    for (const r of rows) delete (r as any)[''];
  }
  return rows;
}

// KNOWN/EXTRAS 분리 + 0행 방지 가드
function mapRow(raw: Record<string, string>, fileId: string, rowNum: number) {
  const known: any = {};
  const extras: Record<string, any> = {};

  for (const [k0, v0] of Object.entries(raw)) {
    const k = (k0 ?? '').trim();
    const v = v0 == null ? '' : String(v0).trim();
    if (KNOWN.has(k)) known[k] = v;
    else extras[k] = v; // ★ 날짜헤더 등 모르는 키는 전부 보존
  }

  const num = (s?: string) => {
    if (!s) return null;
    const t = s.replace(/[^\d.-]/g, '');
    return t === '' ? null : t;
  };
  const ymd = (s?: string) => {
    if (!s) return null;
    const d = s.replace(/[^\d]/g, '');
    return d.length === 8 ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}` : null;
  };

  return {
    tenant_id: known.tenant_id || null,
    sku: known.sku || null,
    channel: known.channel || null,
    warehouse_code: known.warehouse_code || null,
    order_id: known.order_id || null,
    customer_id: known.customer_id || null,
    region: known.region || null,
    brand: known.brand || null,
    sales_date: ymd(known.sales_date),
    qty: num(known.qty),
    revenue: num(known.qty),
    cost: num(known.cost),
    extras,
    file_id: fileId,
    row_num: rowNum
  };
}

// 배치 INSERT (stage_sales)
async function insertStage(client: any, rows: any[], fileId: string) {
  if (!rows.length) return;
  
  // file_id 설정
  rows.forEach(row => row.file_id = fileId);
  
  const cols = [
    'tenant_id','sales_date','sku','channel','qty','revenue','cost',
    'warehouse_code','order_id','customer_id','region','brand',
    'extras','file_id','row_num'
  ];
  
  const batchSize = 5000; // 5k행 단위로 배치 처리
  
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const valuesSql = batch
      .map((_, idx) => `(
        $${idx*15+1}::uuid,       $${idx*15+2}::date,   $${idx*15+3},
        $${idx*15+4},             $${idx*15+5}::numeric, $${idx*15+6}::numeric, $${idx*15+7}::numeric,
        $${idx*15+8},             $${idx*15+9},         $${idx*15+10},
        $${idx*15+11},            $${idx*15+12},
        $${idx*15+13}::jsonb,     $${idx*15+14}::text,  $${idx*15+15}::int
      )`).join(',');

    const params: any[] = [];
    for (const r of batch) {
      params.push(
        r.tenant_id, r.sales_date, r.sku, r.channel, r.qty, r.revenue, r.cost,
        r.warehouse_code, r.order_id, r.customer_id, r.region, r.brand,
        JSON.stringify(r.extras), r.file_id, r.row_num
      );
    }

    const sql = `
      INSERT INTO analytics.stage_sales (
        ${cols.join(',')}
      ) VALUES ${valuesSql}
    `;
    
    try {
      await client.query(sql, params);
      console.log(`[stage] Inserted batch ${Math.floor(i/batchSize)+1}/${Math.ceil(rows.length/batchSize)}: ${batch.length} rows`);
    } catch (e) {
      console.error(`[stage] Batch insert failed at row ${i+1}:`, e);
      // 샘플 3행까지 덤프
      const sampleRows = batch.slice(0, 3).map(r => ({
        tenant_id: r.tenant_id,
        sku: r.sku,
        extras_keys: Object.keys(r.extras || {}),
        row_num: r.row_num
      }));
      console.error('[stage] Sample rows:', sampleRows);
      throw e;
    }
  }
}

export async function copyStage(csv: Buffer, tenant_id: string, file_id: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log(`[stage] Parsing CSV for file_id=${file_id}`);
    const rawRows = parseCsvBuffer(csv);
    if (rawRows.length === 0) {
      // ❗무한 재시도 방지: 실패로 마킹하고 중단
      await mark(file_id, { status: 'failed', error: 'parsed_zero_rows' });
      console.error('[stage] 0 parsed rows → mark failed and stop');
      return; // ← try_merge 호출하지 말기
    }
    
    // map + stage insert
    const rows = rawRows.map((r, i) => mapRow(r, file_id, i + 1));
    console.log(`[stage] Mapped ${rows.length} rows`);
    
    // tenant_id 설정
    rows.forEach((row: any) => row.tenant_id = tenant_id);
    
    console.log(`[stage] Inserting into stage_sales...`);
    await insertStage(client, rows, file_id);
    
    await client.query('COMMIT');
    console.log(`[stage] Successfully staged ${rows.length} rows for file_id=${file_id}`);
    
    // 4) 무한 업로드 재시도 끊기
    if (rows.length === 0) {
      throw new Error('No rows to merge - staging resulted in 0 rows');
    }
    
    // 스테이징 완료 후 머지 호출
    console.log(`[merge] Calling analytics.try_merge_stage_to_fact...`);
    const res = await client.query(
      'SELECT analytics.try_merge_stage_to_fact($1::text) as r',
      [file_id]
    );
    console.log('[merge]', res.rows[0].r);
    
    const result = res.rows[0].r;
    if (result.status !== 'merged') {
      throw new Error(`Merge failed: ${JSON.stringify(result)}`);
    }
    
    console.log(`[merge] Successfully merged ${result.merged_rows} rows to fact_sales`);
    
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// === 아래는 샘플 엔트리포인트(기존 폴링/다운로드 루프와 합쳐 사용). 필요시 수정 ===
async function main() {
  console.log('[env-check]', {
    url: process.env.SUPABASE_URL,
    keyLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
    bucket: process.env.INGEST_BUCKET || 'ingest',
    pollMs: process.env.INGEST_POLL_MS || '5000',
  });

  // SQL 마이그레이션 적용
  await applyMigrations();

  // 폴링/다운로드 로직 시작
  await loop();
}

async function loop() {
  while (true) {
    try {
      console.log("Polling for new uploads...");
      
      // get pending uploads (including failed ones to retry)
      const { data: uploads, error } = await supabase
        .schema('analytics')
        .from("raw_uploads")
        .select("*")
        .or("status.eq.RECEIVED,status.eq.failed")
        .limit(1);
      
      // Storage에서 직접 파일 확인 (디버깅용)
      const { data: list, error: listError } = await supabase.storage
        .from(BUCKET)
        .list(PREFIX, { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

      if (listError) {
        console.error('[poll] list error', listError);
      } else {
        console.log('[poll] found %d objects under %s/', list?.length ?? 0, PREFIX);
        list?.slice(0,5).forEach(o => console.log(' -', o.name));
      }
      
      if (error) {
        console.error("Failed to fetch uploads:", error);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      
      if (!uploads || uploads.length === 0) {
        console.log("No pending uploads");
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      
      const upload = uploads[0];
      console.log("Processing upload:", upload.file_id);
      
      try {
        // mark as processing
        await mark(upload.file_id, { status: "processing" });
        
        // download file
        const csv = await downloadFile(upload.path);
        console.log("Downloaded file, size:", csv.length);
        
        // stage data
        await copyStage(Buffer.from(csv), upload.tenant_id, upload.file_id);
        console.log("Staged data successfully");
        
        // merge to fact table (이미 copyStage에서 호출됨)
        
        // mark as completed
        await mark(upload.file_id, { status: "completed" });
        console.log("Upload completed successfully");
        
      } catch (e) {
        console.error("Failed to process upload:", e);
        await mark(upload.file_id, { status: "failed" });
      }
      
    } catch (e) {
      console.error("Loop error:", e);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// Supabase client for status updates
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function mark(file_id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.schema("analytics").from("raw_uploads")
    .update(patch).eq("file_id", file_id);
  if (error) throw error;
}

async function downloadFile(path: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from('ingest').download(path);
  if (error) throw error;
  return new Uint8Array(await data.arrayBuffer());
}

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
