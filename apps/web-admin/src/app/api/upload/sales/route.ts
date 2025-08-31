import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tenantId = formData.get('tenant_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant_id provided' }, { status: 400 });
    }

    // CSV 파일 읽기
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'Invalid CSV file - need at least header and one data row' }, { status: 400 });
    }

    // 헤더 확인
    const header = lines[0].split(',');
    const expectedHeader = ['sale_date', 'barcode', 'productName', 'qty', 'unit_price', 'revenue', 'channel', 'tenant_id'];
    
    if (!expectedHeader.every(col => header.includes(col))) {
      return NextResponse.json({ 
        error: 'Invalid CSV header', 
        expected: expectedHeader, 
        actual: header 
      }, { status: 400 });
    }

    // 데이터 파싱
    const salesData = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      if (values.length !== expectedHeader.length) continue;
      
      const sale = {
        sale_date: values[0],
        barcode: values[1],
        productName: values[2],
        qty: parseInt(values[3]) || 0,
        unit_price: parseFloat(values[4]) || 0,
        revenue: parseFloat(values[5]) || 0,
        channel: values[6],
        tenant_id: values[7] || tenantId
      };
      
      salesData.push(sale);
    }

    if (salesData.length === 0) {
      return NextResponse.json({ error: 'No valid data rows found' }, { status: 400 });
    }

    // Supabase 연결
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, {
      db: { schema: 'public' }
    });

    // 새 데이터 삽입
    const { data, error } = await supabase
      .from('sales')
      .insert(salesData)
      .select();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ 
        error: 'Failed to insert data', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${salesData.length} sales records`,
      inserted: data?.length || 0,
      total: salesData.length,
      sample: data?.[0] || null
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
